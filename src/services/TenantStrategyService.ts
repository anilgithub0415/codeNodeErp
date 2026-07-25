// src/services/TenantService.ts
// Use ES Module imports consistently
import { Repository,EntityManager, FindOptionsWhere } from 'typeorm'; // Import Repository directly for init method
import { TenantStrategy } from '../entity/TenantStrategy';

//import { generateUUID } from '../utils/uuid'; // Assuming you put generateUUID here
import { generateUUID} from '../Utilities/Utility'
import { AppDataSource } from '../../data-source';
export interface CreateStrategyDto {
    id?: number;
    tenantId: number;
    tenantStrategyName: string;
    tenantStrategy: string;
    createdByUserId?: number;
    [key: string]: any;
}

class TenantStrategyService {
    private tenantStrategyRepository!: Repository<TenantStrategy>;
    

    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the TenantService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Tenant.
     */
    async init(tenantStrategyRepo: Repository<TenantStrategy>): Promise<void> {
        this.tenantStrategyRepository = tenantStrategyRepo;
        
        console.log("TenantStrategyService repositories initialized.");
    }

    getTenantStrategies = async (ptenantId:number): Promise<TenantStrategy[]> => { // Or Observable<EnumOption[]>
        if (!this.tenantStrategyRepository) {
            throw new Error("tenantStrategyRepository repository not initialized. Call init() first.");
        }
        return await this.tenantStrategyRepository.find({where:{tenantId:ptenantId}});

    }
     async getTenantStrategy(
                ptenantId:number,   pId:number,        
                manager?: EntityManager
            ): Promise<TenantStrategy> {
    
                 if (!this.tenantStrategyRepository) {
                            throw new Error("DistrictService repository not initialized. Call init() first.");
                        }
    
                       
                        
                        const tenantStrategyRepository = manager ? manager.getRepository(TenantStrategy) : this.tenantStrategyRepository;
                        const ps= await tenantStrategyRepository.findOne({where:{tenantId:ptenantId , id:pId}}); 
                     
                        
                        return ps!; 
                    }

// src/services/TenantStrategyService.ts (Part 2)
    // Legacy Upsert Sequence Engine
    async createStrategy(createDto: CreateStrategyDto, manager?: EntityManager): Promise<{ strategy: TenantStrategy }> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const repo = queryRunner!.manager.getRepository(TenantStrategy);
            let targetRecord: TenantStrategy;

            const { id, tenantId, ...uniqueIdentifiers } = createDto;
            let queryCondition: FindOptionsWhere<TenantStrategy> = { tenantId };
            
            if (createDto.id) {
                queryCondition.id = createDto.id;
            } else {
                Object.assign(queryCondition, uniqueIdentifiers);
            }

            let existing = await repo.findOne({ where: queryCondition });

            if (existing) {
                Object.assign(existing, createDto);
                targetRecord = existing;
                await repo.save(existing);
            } else {
                const { id: payloadId, ...strategyData } = createDto;
                let newStrategy = repo.create({
                    ...strategyData,
                    tenantId,
                    ...(payloadId && payloadId > 0 ? { id: payloadId } : {})
                });
                targetRecord = newStrategy;
                await repo.save(newStrategy);
            }

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return { strategy: targetRecord };
        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createStrategy transactional execution:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }

    // Strict POST action pipeline
    async createStrategyClean(createDto: CreateStrategyDto, manager?: EntityManager): Promise<TenantStrategy> {
        if (!this.tenantStrategyRepository) {
            throw new Error("TenantStrategyService repository not initialized. Call init() first.");
        }
        const repo = manager ? manager.getRepository(TenantStrategy) : this.tenantStrategyRepository;
        const { id, ...cleanPayload } = createDto;

        const newStrategy = repo.create(cleanPayload);
        return await repo.save(newStrategy);
    }

    // Strict PUT action pipeline
    async updateStrategy(id: number, tenantId: number, updateDto: Partial<CreateStrategyDto>, manager?: EntityManager): Promise<TenantStrategy> {
        if (!this.tenantStrategyRepository) {
            throw new Error("TenantStrategyService repository not initialized. Call init() first.");
        }
        const repo = manager ? manager.getRepository(TenantStrategy) : this.tenantStrategyRepository;

        // Security check isolating cross-tenant modifications
        const existingStrategy = await repo.findOne({ where: { id, tenantId } });
        if (!existingStrategy) {
            throw new Error("Strategy record not found or unauthorized cross-tenant resource modification attempt.");
        }

        const { id: payloadId, tenantId: payloadTenantId, ...updatableFields } = updateDto;
        Object.assign(existingStrategy, updatableFields);

        return await repo.save(existingStrategy);
    }

}


export default TenantStrategyService;