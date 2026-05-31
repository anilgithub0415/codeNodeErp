// src/services/TenantService.ts
// Use ES Module imports consistently
import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method
import { Tenant } from '../entity/Tenant'; // Import Tenant entity and its enums
import {CreateTenantDto, UpdateTenantDto}from '../Models/Tenant'
// Import the new lookup entities
import { TenantTypeLookup } from '../entity/TenantTypeLookup';
import { SubscriptionPlanLookup } from '../entity/SubscriptionPlanLookup';

//import { generateUUID } from '../utils/uuid'; // Assuming you put generateUUID here
import { generateUUID} from '../Utilities/Utility'
import { BackendUpdateTenantDto } from '../dto/tenant.dto';
import { getTenantStrategyServiceRepository } from '../dependencies';
import { TenantStrategy } from '../entity/TenantStrategy';
import { TenantFormConfigs } from '../entity/TenantFormConfigs';


class TenantFormService {
    private tenantFormRepository!: Repository<TenantFormConfigs>; // Will be set by init method
    

    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the TenantService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Tenant.
     */
    async init(tenantRepo: Repository<TenantFormConfigs>
        ): Promise<void> {
        this.tenantFormRepository = tenantRepo
       
        
        console.log("TenantFormService repositories initialized.");
    }

    /**
     * Retrieves a single Tenant by its ID.
     * @param id The tenantId.
     * @returns The Tenant entity, or undefined if not found.
     */
    getTenantForm = async (ptenantId:string,pformKey: string
        ,manager?: EntityManager): Promise<TenantFormConfigs | null | undefined> => {
        if (!this.tenantFormRepository) {
            throw new Error("TenantFormService repository not initialized. Call init() first.");
        }
        const tenantFormRepository = manager ? manager.getRepository(TenantFormConfigs) : this.tenantFormRepository;
        return await tenantFormRepository.findOne({ where: { tenantId: ptenantId, FormKey: pformKey} });
    }



}


export default TenantFormService;