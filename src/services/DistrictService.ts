
import { EntityManager, FindOptionsWhere, Not, Repository } from 'typeorm';
import { District } from '../entity/District';



import { AppDataSource } from '../../data-source'; 

interface CreateDistrictDto{
    id?:number;
    tenantId:number;
    districtName:string;
  
    [key:string]:any;
}

export interface CreatedDistrictResponse {
    district: District;
  
}

export class DistrictService{
 private districtRepository!: Repository<District>;
     /**
         * Initializes the DistrictService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param districtRepo The TypeORM Repository instance for District.
         * @param tenantRepo The TypeORM Repository instance for Tenant (if DistrictService needs it).
         */
        async init(districtRepo: Repository<District>): Promise<void> {
            this.districtRepository = districtRepo;
                console.log("DistrictService repository initialized.");       
        }


        async getDistrict(
            ptenantId:number,   pId:number,        
            manager?: EntityManager
        ): Promise<District> {
console.log('hitting url districts');
             if (!this.districtRepository) {
                        throw new Error("DistrictService repository not initialized. Call init() first.");
                    }

                   
                    
                    const districtRepository = manager ? manager.getRepository(District) : this.districtRepository;
                    const ps= await districtRepository.findOne({where:{tenantId:ptenantId , id:pId}}); // Use find() to get all 
                 
                    
                    return ps!; 
                }


        async getDistricts(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<District[]> {
console.log('hitting url districts');
             if (!this.districtRepository) {
                        throw new Error("DistrictService repository not initialized. Call init() first.");
                    }

                    console.log('ptenantId:',ptenantId);
                    
                    const districtRepository = manager ? manager.getRepository(District) : this.districtRepository;
                    const ps= await districtRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all 
                    console.log('districts count:',ps.length);
                    
                    return ps;
                }


    /**
     * Creates a new global District, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the district and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created District entity along with its initial context.
     */
    async createDistrict(
    createDto: CreateDistrictDto,
    manager?: EntityManager
): Promise<CreatedDistrictResponse> {
    const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
    let shouldReleaseQueryRunner = false;

    try {
        if (!manager) {
            await queryRunner!.connect();
            await queryRunner!.startTransaction();
            shouldReleaseQueryRunner = true;
        }

        const districtRepo = queryRunner!.manager.getRepository(District);
        let newORexistingdistrict: District;

        console.log('createDto:',createDto);

        const { id, tenantId, ...uniqueIdentifiers } = createDto;
        let queryCondition: FindOptionsWhere<District> = { tenantId };
        if (createDto.id) {
            queryCondition.id = createDto.id;
        } else {
             Object.assign(queryCondition, uniqueIdentifiers);
        }
        // FIX: Find by ID so you can safely update the districtName property
        let aDistrict = await districtRepo.findOne({ 
            where: queryCondition
        });

        if (aDistrict) {
            console.log(`Found existing district ID: ${createDto.id}. Updating fields.`);
            
            
            const updateData = {
                ...createDto,
                districtName: createDto.districtName 
            };

            Object.assign(aDistrict, updateData);
            newORexistingdistrict = aDistrict;

            await districtRepo.save(aDistrict); 
        } else {
            console.log(`District not found. Creating new entry.`);

            const { id, ...districtData } = createDto;
            let newDistrict = districtRepo.create({
                ...districtData,
                 ...(id && id > 0 ? { id } : {}) 
                 //                districtName: createDto.districtName
            });
       
            newORexistingdistrict = newDistrict;
            await districtRepo.save(newDistrict);  
        }

        if (shouldReleaseQueryRunner) {
            await queryRunner!.commitTransaction();
        }

        return { district: newORexistingdistrict };

    } catch (error) {
        if (shouldReleaseQueryRunner) {
            await queryRunner!.rollbackTransaction();
        }
        console.error('Error in createDistrict:', error);
        throw error;
    } finally {
        if (shouldReleaseQueryRunner) {
            await queryRunner!.release();
        }
    }
}

//---xyz---
// Inside your export class DistrictService { ... }

/**
 * Strict POST Action: Creates a brand new, unique District instance record.
 */
async createDistrictClean(
    createDto: CreateDistrictDto,
    manager?: EntityManager
): Promise<District> {
    const districtRepo = manager ? manager.getRepository(District) : this.districtRepository;

    if (!this.districtRepository) {
        throw new Error("DistrictService repository not initialized. Call init() first.");
    }

    // Completely strip any user-supplied IDs to eliminate sequence overwrite risks
    const { id, ...cleanCreatePayload } = createDto;

    const newDistrict = districtRepo.create(cleanCreatePayload);
    console.log(`[DistrictService] Generating unique district instance context for: ${cleanCreatePayload.districtName}`);
    return await districtRepo.save(newDistrict);
}

/**
 * Strict PUT Action: Overwrites an existing district profile safely after enforcing tenant validation.
 */
async updateDistrict(
    id: number,
    tenantId: number,
    updateDto: Partial<CreateDistrictDto>,
    manager?: EntityManager
): Promise<District> {
    const districtRepo = manager ? manager.getRepository(District) : this.districtRepository;

    if (!this.districtRepository) {
        throw new Error("DistrictService repository not initialized. Call init() first.");
    }

    // 🔒 Security Boundary: Confirm resource ownership within active session tenant namespace [6]
    const existingDistrict = await districtRepo.findOne({ where: { id, tenantId } });

    if (!existingDistrict) {
        throw new Error("District record not found or unauthorized cross-tenant resource modification attempt.");
    }

    // Erase structural tracking fields out of incoming change payload
    const { id: payloadId, tenantId: payloadTenantId, ...updatableFields } = updateDto;

    // Apply mutation payload context cleanly onto the tracked entity instance 
    Object.assign(existingDistrict, updatableFields);

    console.log(`[DistrictService] Saving updated structural variables for District ID: ${id}`);
    return await districtRepo.save(existingDistrict);
}



    }
           
export default DistrictService