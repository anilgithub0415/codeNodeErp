
import { Repository,EntityManager } from 'typeorm'; 
import { Tenant_custom_scripts } from '../entity/Tenant_custom_scripts';
import { getTenantCustomScriptsServiceRepository } from '../dependencies';

class Tenant_custom_scriptsService{
private tenantCustomScriptsRepository!: Repository<Tenant_custom_scripts>;
        constructor() {
            // Constructor is lean, repository will be injected or set via init
        }
    
        /**
         * Initializes the TenantService with its TypeORM repository.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param repo The TypeORM Repository instance for Tenant.
         */
        async init(tenantCustomScriptsRepo: Repository<Tenant_custom_scripts>): Promise<void> {
            this.tenantCustomScriptsRepository = tenantCustomScriptsRepo;
            
            console.log("TenantCustomScriptsService repositories initialized.");
        }

    async getTenantSript(tenantId:string, scriptName:string):Promise<any>{

             if (!this.tenantCustomScriptsRepository) {
            throw new Error("tenantCustomScriptsRepository repository not initialized. Call init() first.");
        }
        return await this.tenantCustomScriptsRepository.findOne({where:{tenantId:tenantId, scriptName:scriptName}});
                    
    }
}

export default Tenant_custom_scriptsService