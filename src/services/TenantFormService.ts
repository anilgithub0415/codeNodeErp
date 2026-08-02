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

export interface CreateFormConfigDto {
    id?: number;
    tenantId: number;
    FormKey: string;
    FormlyConfig: string;
    [key: string]: any;
}


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
 getTenantFormConfigs = async (ptenantId: number): Promise<TenantFormConfigs[]> => {
        if (!this.tenantFormRepository) {
            throw new Error("formConfigRepository repository not initialized. Call init() first.");
        }
        return await this.tenantFormRepository.find({ where: { tenantId: ptenantId } });
    }
    /**
     * Retrieves a single Tenant by its ID.
     * @param id The tenantId.
     * @returns The Tenant entity, or undefined if not found.
     */
    getTenantForm = async (ptenantId:number,pformKey: string
        ,manager?: EntityManager): Promise<TenantFormConfigs | null | undefined> => {
        if (!this.tenantFormRepository) {
            throw new Error("TenantFormService repository not initialized. Call init() first.");
        }
        const tenantFormRepository = manager ? manager.getRepository(TenantFormConfigs) : this.tenantFormRepository;
        return await tenantFormRepository.findOne({ where: { tenantId: ptenantId, FormKey: pformKey} });
    }
        // Strict POST action pipeline
        async createFormConfig(tenantId: number, createDto: CreateFormConfigDto, manager?: EntityManager): Promise<any> {
        if (!this.tenantFormRepository) {
        throw new Error("TenantFormConfigsService repository not initialized. Call init() first.");
        }
        const repo = manager ? manager.getRepository(TenantFormConfigs) : this.tenantFormRepository; 

        // Security check isolating tenant context and stripping malicious payloads
        const { id: payloadId, tenantId: payloadTenantId, ...safeFields } = createDto;

        // Instantiate new entity instance populated with safe context
        const newConfig = repo.create({
        ...safeFields,
        tenantId // Enforce the authenticated session's tenantId directly
        });

        return await repo.save(newConfig);

        }
        
 // Strict PUT action pipeline
    async updateFormConfig(id: number, tenantId: number, updateDto: Partial<CreateFormConfigDto>, manager?: EntityManager): Promise<TenantFormConfigs> {
        if (!this.tenantFormRepository) {
            throw new Error("TenantFormConfigsService repository not initialized. Call init() first.");
        }
        const repo = manager ? manager.getRepository(TenantFormConfigs) : this.tenantFormRepository;

        // Security check isolating cross-tenant modifications
        const existingConfig = await repo.findOne({ where: { id, tenantId } });
        if (!existingConfig) {
            throw new Error("Form configuration record not found or unauthorized cross-tenant resource modification attempt.");
        }

        const { id: payloadId, tenantId: payloadTenantId, ...updatableFields } = updateDto;
        Object.assign(existingConfig, updatableFields);

        return await repo.save(existingConfig);
    }

}


export default TenantFormService;