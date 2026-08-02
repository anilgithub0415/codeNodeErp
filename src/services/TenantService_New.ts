import { EntityManager, Repository } from 'typeorm';
import { Tenant } from '../entity/Tenant';
import { AppDataSource } from '../../data-source'; 
import { Not } from 'typeorm';

interface CreateTenantDto {
    tenantId?: number;
    tenantName: string;
    autocodeConfig?: {
        faculty?: string;
        student?: string;
    };
    tenantTypeName: string;
    subscriptionPlanName: string;
    subscriptionEndDate?: Date | string | null;
    isActive?: boolean;
    [key: string]: any;
}

export interface CreatedTenantResponse {
    tenant: Tenant;
}

export class TenantService_New {
    private tenantRepository!: Repository<Tenant>;

    /**
     * Initializes the TenantService_New with its TypeORM repository instance.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param tenantRepo The TypeORM Repository instance for Tenant.
     */
    async init(tenantRepo: Repository<Tenant>): Promise<void> {
        this.tenantRepository = tenantRepo;
        console.log("TenantService_New repository initialized.");       
    }

    async getTenant(
        pTenantId: number,        
        manager?: EntityManager
    ): Promise<Tenant | null> {
        
        if (!this.tenantRepository) {
            throw new Error("TenantService_New repository not initialized. Call init() first.");
        }
        
        const tenantRepository = manager ? manager.getRepository(Tenant) : this.tenantRepository;
        const tenant = await tenantRepository.findOne({ 
            where: { tenantId: pTenantId },
            relations: ['tenantType', 'subscriptionPlan'] // Eager load the lookup configuration sets
        }); 
        
        return tenant; 
    }

   // Make sure to import Not at the top of your file

async getTenants(
    manager?: EntityManager
): Promise<Tenant[]> {
    
    if (!this.tenantRepository) {
        throw new Error("TenantService_New repository not initialized. Call init() first.");
    }
    
    const tenantRepository = manager ? manager.getRepository(Tenant) : this.tenantRepository;
    const tenants = await tenantRepository.find({
        where: {
            tenantId: Not(0) // Skips the 'System' tenant record
        },
        relations: ['tenantType', 'subscriptionPlan']
    }); 
    
    return tenants;
}


    /**
     * Creates a new Tenant or updates an existing one if the tenantId matches.
     *
     * @param createDto Data for creating/updating the Tenant.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created/updated Tenant entity wrapper.
     */
    async createTenant(
        createDto: CreateTenantDto,
        manager?: EntityManager
    ): Promise<CreatedTenantResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const tenantRepo = queryRunner!.manager.getRepository(Tenant);
            
            let newORexistingTenant: Tenant;
            let aTenant = createDto.tenantId ? await tenantRepo.findOne({ where: { tenantId: createDto.tenantId } }) : null;
           
            if (aTenant) {
                console.log(`found tenant with id: ${createDto.tenantId}`);
                
                // Parse date string safely if passed from frontend payload
                if (createDto.subscriptionEndDate) {
                    createDto.subscriptionEndDate = new Date(createDto.subscriptionEndDate);
                }

                Object.assign(aTenant, createDto);  
                newORexistingTenant = aTenant;
                console.log('updating:', aTenant);
                await tenantRepo.save(aTenant); 
            } else {
                if (createDto.subscriptionEndDate) {
                    createDto.subscriptionEndDate = new Date(createDto.subscriptionEndDate);
                }
                
                let newTenant = tenantRepo.create(createDto);
                newORexistingTenant = newTenant;
                await tenantRepo.save(newTenant);  
            }

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return { tenant: newORexistingTenant };

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createTenant:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }
}
           
export default TenantService_New;
