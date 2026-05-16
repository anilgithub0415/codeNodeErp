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
// Or: import { generateUUID } from '../Special/helpers'; // If you put it here

// Import dependency getters
// import { getTenantServiceRepository } from '../dependencies'; // Assuming you add this getter

// --- Define the DTO for Tenant updates ---
// Omit 'tenantId' because it's the PK and shouldn't be updated via DTO
// Omit 'createdAt', 'updatedAt' as these are managed by TypeORM decorators
// Tenant entity does not typically have a 'password', so remove that from DTO
// type TenantUpdateDTO = Partial<Omit<Tenant, 'tenantId' | 'createdAt' | 'updatedAt' | 'users'>>;

// It's good practice to get repositories via a central dependency manager (like dependencies.ts)
// rather than instantiating them directly in services like this, especially if DataSource init is async.
// However, for this specific service file, we will assume getTenantRepository() from dependencies.ts
// provides a ready-to-use instance.

class TenantService {
    private tenantRepository!: Repository<Tenant>; // Will be set by init method
    private tenantTypeLookupRepository!: Repository<TenantTypeLookup>; // NEW: Repository for TenantTypeLookup
    private subscriptionPlanLookupRepository!: Repository<SubscriptionPlanLookup>; // NEW: Repository for SubscriptionPlanLookup

    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the TenantService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Tenant.
     */
    async init(tenantRepo: Repository<Tenant>,
        tenantTypeLookupRepo: Repository<TenantTypeLookup>,
        subscriptionPlanLookupRepo: Repository<SubscriptionPlanLookup>): Promise<void> {
        this.tenantRepository = tenantRepo
        this.tenantTypeLookupRepository = tenantTypeLookupRepo;
        this.subscriptionPlanLookupRepository = subscriptionPlanLookupRepo;;
        console.log("TenantService repositories initialized.");
    }

    // /**
    //  * Creates a new Tenant record in the database.
    //  * @param tenantData The data for the new tenant.
    //  * @returns The newly created Tenant entity.
    //  */
    // CreateTenant = async (tenantData: { tenantName: string; tenantType: TenantType; subscriptionPlan?: SubscriptionPlan }): Promise<Tenant> => {
    //     // Ensure tenantName and tenantType are provided
    //     if (!tenantData.tenantName || !tenantData.tenantType) {
    //         throw new Error('TenantName and TenantType are required.');
    //     }

    //     // Create an instance of the TypeORM Tenant entity
    //     const newTenant = new Tenant();
    //     newTenant.tenantId = generateUUID(); // Assign a UUID
    //     newTenant.tenantName = tenantData.tenantName;
    //     newTenant.tenantType = tenantData.tenantType;
    //     newTenant.subscriptionPlan = tenantData.subscriptionPlan || SubscriptionPlan.FREE; // Use default if not provided
    //     newTenant.isActive = true; // Default

    //     // Save the new tenant to the database
    //     return await this.tenantRepository.save(newTenant);
    // }

    /**
     * Creates a new Tenant record in the database.
     * @param tenantData The data for the new tenant (now using CreateTenantDto with string types).
     * @returns The newly created Tenant entity.
     */
    CreateTenant = async (tenantData: CreateTenantDto
        ,manager?: EntityManager ): Promise<Tenant> => {
        // Ensure repositories are initialized
        if (!this.tenantRepository || !this.tenantTypeLookupRepository || !this.subscriptionPlanLookupRepository) {
            throw new Error("TenantService repositories not initialized. Call init() first.");
        }

        // 1. Validate required fields from DTO
        if (!tenantData.tenantName || !tenantData.tenantType) {
            throw new Error('Tenant Name and Tenant Type are required.');
        }
 // Get the appropriate repositories: transactional if manager is provided, else global
 const tenantRepository = manager ? manager.getRepository(Tenant) : this.tenantRepository;
 const tenantTypeLookupRepository = manager ? manager.getRepository(TenantTypeLookup) : this.tenantTypeLookupRepository;
 const subscriptionPlanLookupRepository = manager ? manager.getRepository(SubscriptionPlanLookup) : this.subscriptionPlanLookupRepository;

        // 2. Fetch the actual lookup entities based on the provided string names
        const tenantType = await tenantTypeLookupRepository.findOne({ where: { typeName: tenantData.tenantType } });
        if (!tenantType) {
            throw new Error(`Invalid Tenant Type: '${tenantData.tenantType}'.`);
        }

        // Get subscription plan, defaulting to 'Free' if not provided
        const subscriptionPlanName = tenantData.subscriptionPlan || 'Free'; // Use 'Free' as default string
        const subscriptionPlan = await subscriptionPlanLookupRepository.findOne({ where: { planName: subscriptionPlanName } });
        if (!subscriptionPlan) {
            throw new Error(`Invalid Subscription Plan: '${subscriptionPlanName}'.`);
        }

        // 3. Create an instance of the TypeORM Tenant entity
        const newTenant = new Tenant();
        newTenant.tenantId = generateUUID(); // Assign a UUID
        newTenant.tenantName = tenantData.tenantName;
        newTenant.isActive = true; // Default

        // 4. Assign the fetched lookup entities to the relationship properties
        newTenant.tenantType = tenantType;
        newTenant.subscriptionPlan = subscriptionPlan;

        // TypeORM should automatically handle saving the foreign key string values
        // (tenantType and subscriptionPlan columns) based on the assigned relationship objects.
        // You do NOT explicitly set newTenant.tenantTypeName = tenantType.typeName; etc.
        if (!tenantData.autocodeConfig ){
         // The JSON string you have
                const autocodeConfigJsonString = '{"student": "STU-{YYYY}-{NNNN}", "faculty":"FAC-{YYYY}-{NNNN}"}';

                // Use JSON.parse() to convert the JSON string into a JavaScript object
                const autocodeConfigObject = JSON.parse(autocodeConfigJsonString);

                // Now, assign the parsed object to the property
                // The types now match, so this will no longer throw an error.
                newTenant.autocodeConfig = autocodeConfigObject;
        }

        // 5. Save the new tenant to the database
        return await tenantRepository.save(newTenant);
    }


    /**
     * Updates an existing Tenant record in the database.
     * @param id The tenantId of the tenant to update.
     * @param tenantData The partial data for the update.
     * @returns The updated Tenant entity, or undefined if not found.
     */

    updateTenant = async (id: string, tenantData: BackendUpdateTenantDto
        ,manager?: EntityManager ): Promise<Tenant | undefined> => {
        // Ensure repository is initialized
        if (!this.tenantRepository) {
            throw new Error("TenantService repository not initialized. Call init() first.");
        }
        const tenantRepository = manager ? manager.getRepository(Tenant) : this.tenantRepository;

        // 1. Fetch the existing tenant from the database
        const existingTenant = await tenantRepository.findOne({ where: { tenantId: id } }); // Use findOne with where

        if (!existingTenant) {
            // If tenant is not found, return undefined (controller will handle 404)
            return undefined;
        }
console.log();

        // 2. Apply updates from tenantData to the existingTenant object
        // Object.assign is much cleaner for partial updates

        //commented below
       // Object.assign(existingTenant, tenantData);
//replaced by this below
if (tenantData.tenantType !== undefined) {
    const newTenantType = await this.tenantTypeLookupRepository.findOne({ where: { typeName: tenantData.tenantType } });
    if (!newTenantType) {
        throw new Error(`Invalid Tenant Type: '${tenantData.tenantType}'.`);
    }
    existingTenant.tenantType = newTenantType;
}

if (tenantData.subscriptionPlan !== undefined) {
    const newSubscriptionPlan = await this.subscriptionPlanLookupRepository.findOne({ where: { planName: tenantData.subscriptionPlan } });
    if (!newSubscriptionPlan) {
        throw new Error(`Invalid Subscription Plan: '${tenantData.subscriptionPlan}'.`);
    }
    existingTenant.subscriptionPlan = newSubscriptionPlan;
}

// Apply scalar updates
if (tenantData.tenantName !== undefined) existingTenant.tenantName = tenantData.tenantName;
if (tenantData.subscriptionEndDate !== undefined) existingTenant.subscriptionEndDate = tenantData.subscriptionEndDate;
if (tenantData.isActive !== undefined) existingTenant.isActive = tenantData.isActive;

        // Do not update tenantId directly as it's a primary key.
        // createdAt and updatedAt are handled by TypeORM decorators if setup correctly.

        try {
            // 3. Save the modified existingTenant object using TypeORM's save()
            // TypeORM's save method intelligently performs an UPDATE when the entity has an existing primary key (id)
            const savedTenant = await tenantRepository.save(existingTenant);

            return savedTenant;
        } catch (error: any) {
            console.error('Error updating tenant in service:', error);
            throw error;
        }
    }

    /**
     * Retrieves a single Tenant by its ID.
     * @param id The tenantId.
     * @returns The Tenant entity, or undefined if not found.
     */
    getTenant = async (id: string
        ,manager?: EntityManager): Promise<Tenant | null | undefined> => {
        if (!this.tenantRepository) {
            throw new Error("TenantService repository not initialized. Call init() first.");
        }
        const tenantRepository = manager ? manager.getRepository(Tenant) : this.tenantRepository;
        return await tenantRepository.findOne({ where: { tenantId: id } });
    }

    /**
     * Retrieves all Tenant records from the database.
     * @returns An array of Tenant entities.
     */
    getTenants = async (ptenantId:string
        ,manager?: EntityManager): Promise<Tenant[]> => {
        if (!this.tenantRepository) {
            throw new Error("TenantService repository not initialized. Call init() first.");
        }
        const tenantRepository = manager ? manager.getRepository(Tenant) : this.tenantRepository;
        return await tenantRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all
    }

    /**
     * Deletes a tenant by its ID.
     * @param id The tenantId of the tenant to delete.
     */
    deleteTenant = async (id: string
        ,manager?: EntityManager): Promise<void> => {
        if (!this.tenantRepository) {
            throw new Error("TenantService repository not initialized. Call init() first.");
        }
        const tenantRepository = manager ? manager.getRepository(Tenant) : this.tenantRepository;
        await tenantRepository.delete(id);
    }

    // NEW: Methods to fetch lookup options for dropdowns
    getTenantTypes = async (): Promise<TenantTypeLookup[]> => { // Or Observable<EnumOption[]> if backend sends label/value
        if (!this.tenantTypeLookupRepository) {
            throw new Error("tenantTypeLookupRepository repository not initialized. Call init() first.");
        }
        return await this.tenantTypeLookupRepository.find();

    }

    getSubscriptionPlans = async (): Promise<SubscriptionPlanLookup[]> => { // Or Observable<EnumOption[]>
        if (!this.subscriptionPlanLookupRepository) {
            throw new Error("subscriptionPlanLookupRepository repository not initialized. Call init() first.");
        }
        return await this.subscriptionPlanLookupRepository.find();

    }

}

// Export a single instance for use as a singleton
//export default new TenantService();


export default TenantService;