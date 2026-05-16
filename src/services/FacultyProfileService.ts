// src/services/FacultyProfileService.ts
// Use ES Module imports consistently
import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method
import { FacultyProfile,  } from '../entity/FacultyProfile'; // Import FacultyProfile entity and its enums
import { CreateFacultyProfileDto, UpdateFacultyProfileDto } from '../Models/FacultyProfile.interfaces';

class FacultyProfileService {
    private facultyProfileRepository!: Repository<FacultyProfile>; // Will be set by init method
    
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the FacultyProfileService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for FacultyProfile.
     */
    async init(facultyProfileRepo: Repository<FacultyProfile>): Promise<void> {
        this.facultyProfileRepository = facultyProfileRepo;
        console.log("FacultyProfileService repositories initialized.");
    }

   
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param facultyProfileDto The DTO containing the data for the new facultyProfile.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created FacultyProfile.
     */
    async createFacultyProfile(facultyProfileDto: CreateFacultyProfileDto, manager?: EntityManager): Promise<FacultyProfile> {
        // This is a concise and correct way to get the right repository.
        const repo = manager ? manager.getRepository(FacultyProfile) : this.facultyProfileRepository;

          //Autocoding part ----------------------------------------------------------------------------------------  	    
                                        // CRITICAL STEP: Find the highest existing number for this tenant and year.
                                            // We use `createQueryBuilder` to perform a custom MAX() aggregation
                                            // on the numeric part of the employeeIdNumber.
                                            const currentYear = new Date().getFullYear();
                                            const lastEmployeeProfile = await repo.createQueryBuilder('sp')
                                            .select("MAX(CAST(SUBSTRING(sp.employeeIdNumber, 6, 5) AS INT))", "maxNumber")
                                            .where("sp.tenantId = :tenantId", { tenantId: facultyProfileDto.tenantId })
                                            .andWhere("sp.employeeIdNumber LIKE :yearPrefix", { yearPrefix: `${currentYear}-%` })
                                            .getRawOne();
                                        
                                        const lastNumber = lastEmployeeProfile?.maxNumber || 0;
                                        const nextNumber = lastNumber + 1;

                                        // Format the new employeeIdNumber as YYYY-NNNNN
                                        const nextIdNumber = `${currentYear}-${String(nextNumber).padStart(5, '0')}`;
                                        facultyProfileDto.employeeIdNumber=nextIdNumber;
                    //Autocoding part ----------------------------------------------------------------------------------------

        // --- THIS IS THE KEY LINE TO AVOID MANUAL ASSIGNMENT ---
        // TypeORM's `create` method takes a plain object (our DTO) and returns a new
        // entity instance with all the properties correctly mapped.
        const newFacultyProfile = repo.create(facultyProfileDto);
        
        return repo.save(newFacultyProfile);
    }

    /**
     * Updates an existing FacultyProfile with the given data.
     * @param id The ID of the facultyProfile to update.
     * @param facultyProfileDto The DTO containing the data for the facultyProfile update.
     * @returns A Promise of the updated FacultyProfile entity.
     */
    async updateFacultyProfile(id: number, facultyProfileDto: UpdateFacultyProfileDto): Promise<FacultyProfile> {
        const facultyProfile = await this.facultyProfileRepository.findOneBy({ id });
        
        if (!facultyProfile) {
            throw new Error('FacultyProfile not found');
        }

        // Object.assign is a great way to merge the DTO properties into the entity.
        // It avoids manual, property-by-property assignment.
        Object.assign(facultyProfile, facultyProfileDto);

        return this.facultyProfileRepository.save(facultyProfile);
    }

    /**
     * Deletes a FacultyProfile by its ID.
     * @param id The ID of the facultyProfile to delete.
     * @returns A Promise that resolves once the facultyProfile is deleted.
     */
    async deleteFacultyProfile(id: number): Promise<void> {
        const facultyProfile = await this.facultyProfileRepository.findOneBy({ id });
        
        if (!facultyProfile) {
            throw new Error('FacultyProfile not found');
        }
        
        await this.facultyProfileRepository.remove(facultyProfile);
    }
    /**
     * Retrieves all FacultyProfile records from the database.
     * @returns An array of FacultyProfile entities.
     */
    getFacultyProfiles = async (ptenantId:string,
        manager?: EntityManager): Promise<FacultyProfile[]> => {
       
            
        if (!this.facultyProfileRepository) {
            throw new Error("FacultyProfileService repository not initialized. Call init() first.");
        }
        const facultyProfileRepository = manager ? manager.getRepository(FacultyProfile) : this.facultyProfileRepository;
        return await facultyProfileRepository.find({where:{tenantId:ptenantId} ,relations:['person']}); // Use find() to get all
    }

    
    async getById(id: number,personid?:number
        ,manager?: EntityManager): Promise<FacultyProfile | undefined> {
            
        if (!this.facultyProfileRepository) {
            throw new Error("FacultyProfileService repository not initialized. Call init() first.");
        }
        const facultyProfileRepository = manager ? manager.getRepository(FacultyProfile) : this.facultyProfileRepository;
        
        const whereConditions: any = {};

        if (id) {
          whereConditions.id = id;
        }
      
        if (personid) {
          whereConditions.personId = personid;
        }

        var afacultyProfile = await facultyProfileRepository.findOne({
            where: whereConditions
            
           
        });

        if (afacultyProfile) {
            return afacultyProfile;
        }
        return undefined;
    }

    
    

}



export default FacultyProfileService;