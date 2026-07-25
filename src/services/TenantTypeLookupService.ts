import { EntityManager, Repository } from 'typeorm';
import { TenantTypeLookup } from '../entity/TenantTypeLookup';
import { AppDataSource } from '../../data-source'; 

interface CreateTenantTypeDto {
    typeName: string;
    [key: string]: any;
}

export interface CreatedTenantTypeResponse {
    tenantType: TenantTypeLookup;
}

export class TenantTypeLookupService {
    private tenantTypeRepository!: Repository<TenantTypeLookup>;

    /**
     * Initializes the TenantTypeLookupService with its TypeORM repository instance.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param tenantTypeRepo The TypeORM Repository instance for TenantTypeLookup.
     */
    async init(tenantTypeRepo: Repository<TenantTypeLookup>): Promise<void> {
        this.tenantTypeRepository = tenantTypeRepo;
        console.log("TenantTypeLookupService repository initialized.");       
    }

    async getTenantType(
        pTypeName: string,        
        manager?: EntityManager
    ): Promise<TenantTypeLookup> {
        
        if (!this.tenantTypeRepository) {
            throw new Error("TenantTypeLookupService repository not initialized. Call init() first.");
        }
        
        const tenantTypeRepository = manager ? manager.getRepository(TenantTypeLookup) : this.tenantTypeRepository;
        const type = await tenantTypeRepository.findOne({ where: { typeName: pTypeName } }); 
        
        return type!; 
    }

    async getTenantTypes(
        manager?: EntityManager
    ): Promise<TenantTypeLookup[]> {
        
        if (!this.tenantTypeRepository) {
            throw new Error("TenantTypeLookupService repository not initialized. Call init() first.");
        }
        
        const tenantTypeRepository = manager ? manager.getRepository(TenantTypeLookup) : this.tenantTypeRepository;
        const types = await tenantTypeRepository.find(); 
        
        return types;
    }

    /**
     * Creates a new TenantType or updates an existing one if the typeName matches.
     *
     * @param createDto Data for creating/updating the TenantType.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created/updated TenantType entity wrapper.
     */
    async createTenantType(
        createDto: CreateTenantTypeDto,
        manager?: EntityManager
    ): Promise<CreatedTenantTypeResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const typeRepo = queryRunner!.manager.getRepository(TenantTypeLookup);
            
            let newORexistingType: TenantTypeLookup;
            let aType = await typeRepo.findOne({ where: { typeName: createDto.typeName } });
           
            if (aType) {
                console.log(`found tenant type with name: ${createDto.typeName}`);
                Object.assign(aType, createDto);  
                newORexistingType = aType;
                console.log('updating:', aType);
                await typeRepo.save(aType); 
            } else {
                let newType = typeRepo.create(createDto);
                newORexistingType = newType;
                await typeRepo.save(newType);  
            }

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return { tenantType: newORexistingType };

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createTenantType:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }

    
}
           
export default TenantTypeLookupService;
