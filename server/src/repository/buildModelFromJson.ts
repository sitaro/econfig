import ajv from 'ajv';
import { keyBy } from 'lodash/fp';
import { isArray } from 'util';
import Component from '../core/model/Component.js';
import ConfigKey from '../core/model/ConfigKey.js';
import ConfigValue from '../core/model/ConfigValue.js';
import CoreModel from '../core/model/CoreModel.js';
import { Dimension, DimensionType } from '../core/model/Dimension.js';
import { DimensionValue } from '../core/model/DimensionValue.js';
import * as schema from './modelSchema-00.01.json';

const schemaValidator = new ajv();

export default function buildModelFromJson(json: any) {
    const valid = schemaValidator.validate(schema, json);
    if (!valid) {
        throw new Error('Cannot parse the configuration model: ' +
            schemaValidator.errorsText());
    }

    if (json.version !== '0.1') {
        throw new Error(`Unknown model version ${json.version}`);
    }

    const components = json.components.map((componentDef: any) => {
        const dimensions = buildDimensions(componentDef.dimensions);
        const keys = buildKeys(componentDef.id as string, componentDef.keys,
            dimensions);
        return new Component(componentDef.id, componentDef.description, keys, dimensions);
    });

    return new CoreModel(components);
}

function buildDimensions(dimensionsDef: any[]): Dimension[] {
    return dimensionsDef.map(dimensionDef => new Dimension(
        dimensionDef.id,
        dimensionDef.description,
        dimensionDef.dynamic,
        dimensionDef.type,
    ));
}

function buildKeys(component: string, keysDef: any[], dimensions: Dimension[]) {
    return keysDef.map(keyDef => {
        const key = keyDef.key as string;
        const description = keyDef.description as string;
        const values = keyDef.values.map((valueDef: any) =>
            buildValue(component, key, valueDef, dimensions));
        return new ConfigKey(key, description, values);
    });
}

function buildValue(
    component: string,
    key: string,
    valueDef: any,
    dimensions: Dimension[],
) {
    const dimensionsMap = keyBy('id', dimensions);
    let dimensionValues: DimensionValue[];
    if (isArray(valueDef.dimensions)) {
        dimensionValues = valueDef.dimensions.map((dimensionValueDef: any) => {
            const dimension = dimensionsMap[dimensionValueDef.dimension];
            if (dimension === undefined) {
                throw new Error(`Component ${component} Key ${key} ` +
                    `has a value with an unknown dimension: '${dimensionValueDef.dimension}'`);
            }
            return new DimensionValue(dimension, dimensionValueDef.value);
        });
    } else {
        dimensionValues = [];
    }

    return new ConfigValue(valueDef.value, dimensionValues);
}
