import { isObject, isString } from 'util';
import { TenantConfig } from './TenantConfig';

/**
 * A tenant exists for the purpose of isolating different configurations
 * to allow multi-tenancy of an econfig cluster. Each tenant can administer
 * its own configuration relatively freely and configure its own components
 * and configuration strategies.
 */
export class Tenant {
    public id: string;
    public type = '';

    public tenantConfig: TenantConfig;

    public constructor(yamlConfig: any) {
        if (!isObject(yamlConfig)) {
            throw new Error('Expected config to be an object');
        }

        if (!isString(yamlConfig.id)) {
            throw new Error('The tenant id must be a string');
        }
        this.id = yamlConfig.id as string;

        if (!isString(yamlConfig.type)) {
            throw new Error('The tenant type must be a string for tenant ' + this.id);
        }
        this.type = yamlConfig.type as string;

        switch (yamlConfig.type) {
            case 'inline':
                this.tenantConfig = new TenantConfig(yamlConfig.config, this.id);
                break;
            default:
                throw new Error('The tenant type ' + this.type +
                    ' is not supported for tenant ' + this.id);
        }
    }
}
