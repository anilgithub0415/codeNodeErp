
import { EntityManager, FindOptionsWhere, Not, Repository } from 'typeorm';
import { City } from '../entity/city';



import { AppDataSource } from '../../data-source'; 

interface CreateCityDto{
    id?:number;
    tenantId:number;
    cityName:string;
    cityAbbrevation:string;
    [key:string]:any;
}

export interface CreatedCityResponse {
    city: City;
  
}

export class CityService{
 private cityRepository!: Repository<City>;
     /**
         * Initializes the CityService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param cityRepo The TypeORM Repository instance for City.
         * @param tenantRepo The TypeORM Repository instance for Tenant (if CityService needs it).
         */
        async init(cityRepo: Repository<City>): Promise<void> {
            this.cityRepository = cityRepo;
                console.log("CityService repository initialized.");       
        }


        async getCity(
            ptenantId:number,   pId:number,        
            manager?: EntityManager
        ): Promise<City> {

             if (!this.cityRepository) {
                        throw new Error("CityService repository not initialized. Call init() first.");
                    }

                   
                    
                    const cityRepository = manager ? manager.getRepository(City) : this.cityRepository;
                    const ps= await cityRepository.findOne({where:{tenantId:ptenantId , id:pId}}); // Use find() to get all 
                 
                    
                    return ps!; 
                }


        async getCitys(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<City[]> {

             if (!this.cityRepository) {
                        throw new Error("CityService repository not initialized. Call init() first.");
                    }

                                        
                    const cityRepository = manager ? manager.getRepository(City) : this.cityRepository;
                    const ps= await cityRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all 
                    
                    
                    return ps;
                }


    /**
     * Creates a new global City, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the city and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created City entity along with its initial context.
     */
    async createCity(
    createDto: CreateCityDto,
    manager?: EntityManager
): Promise<CreatedCityResponse> {
    const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
    let shouldReleaseQueryRunner = false;

    try {
        if (!manager) {
            await queryRunner!.connect();
            await queryRunner!.startTransaction();
            shouldReleaseQueryRunner = true;
        }

        const cityRepo = queryRunner!.manager.getRepository(City);
        let newORexistingcity: City;

        console.log('createDto:',createDto);
                const { id, tenantId, ...uniqueIdentifiers } = createDto;
                let queryCondition: FindOptionsWhere<City> = { tenantId };
                if (createDto.id) {
                    queryCondition.id = createDto.id;
                } else {
                     Object.assign(queryCondition, uniqueIdentifiers);
                }
                // FIX: Find by ID so you can safely update the districtName property
                let aCity = await cityRepo.findOne({ 
                    where: queryCondition
                });
        

        if (aCity) {
                     
            
            const updateData = {
                ...createDto,
                cityName: createDto.cityName 
            };

            Object.assign(aCity, updateData);
            newORexistingcity = aCity;

            await cityRepo.save(aCity); 
        } else {
            console.log(`City not found. Creating new entry.`);
            let newCity = cityRepo.create({
                ...createDto,
                cityName: createDto.cityName
            });
       
            newORexistingcity = newCity;
            await cityRepo.save(newCity);  
        }

        if (shouldReleaseQueryRunner) {
            await queryRunner!.commitTransaction();
        }

        return { city: newORexistingcity };

    } catch (error) {
        if (shouldReleaseQueryRunner) {
            await queryRunner!.rollbackTransaction();
        }
        console.error('Error in createCity:', error);
        throw error;
    } finally {
        if (shouldReleaseQueryRunner) {
            await queryRunner!.release();
        }
    }
}

// Inside your export class CityService { ... }

/**
 * Strict POST Action: Creates a brand new, unique City instance record.
 */
async createCityClean(
    createDto: CreateCityDto,
    manager?: EntityManager
): Promise<City> {
    const cityRepo = manager ? manager.getRepository(City) : this.cityRepository;

    if (!this.cityRepository) {
        throw new Error("CityService repository not initialized. Call init() first.");
    }

    // Completely strip any user-supplied IDs to eliminate sequence overwrite risks
    const { id, ...cleanCreatePayload } = createDto;

    const newCity = cityRepo.create(cleanCreatePayload);
    console.log(`[CityService] Generating unique city instance context for: ${cleanCreatePayload.cityName}`);
    return await cityRepo.save(newCity);
}

/**
 * Strict PUT Action: Overwrites an existing city profile safely after enforcing tenant validation.
 */
async updateCity(
    id: number,
    tenantId: number,
    updateDto: Partial<CreateCityDto>,
    manager?: EntityManager
): Promise<City> {
    const cityRepo = manager ? manager.getRepository(City) : this.cityRepository;

    if (!this.cityRepository) {
        throw new Error("CityService repository not initialized. Call init() first.");
    }

    // 🔒 Security Boundary: Confirm resource ownership within active session tenant namespace
    const existingCity = await cityRepo.findOne({ where: { id, tenantId } });

    if (!existingCity) {
        throw new Error("City record not found or unauthorized cross-tenant resource modification attempted.");
    }

    // Erase structural tracking fields out of incoming change payload
    const { id: payloadId, tenantId: payloadTenantId, ...updatableFields } = updateDto;

    // Apply mutation payload context cleanly onto the tracked entity instance 
    Object.assign(existingCity, updatableFields);

    console.log(`[CityService] Saving updated structural variables for City ID: ${id}`);
    return await cityRepo.save(existingCity);
}



    }
           
export default CityService