// src/services/ProgramCourseService.ts
// Use ES Module imports consistently
import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method
import { ProgramCourses } from '../entity/ProgramCourses'; // Import ProgramCourse entity and its enums
import { CreateProgramCourseRequestDto, UpdateProgramCourseRequestDto} from '../Models/ProgramCourse.interfaces'
//import {CreateProgramCourseDto, UpdateProgramCourseDto}from '../Models/ProgramCourse'



//import { BackendUpdateProgramCourseDto } from '../dto/tenant.dto';
// Or: import { generateUUID } from '../Special/helpers'; // If you put it here


class ProgramCourseService {
    private programCourseRepository!: Repository<ProgramCourses>; // Will be set by init method
  
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the ProgramCourseService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for ProgramCourse.
     */
    async init(programCourseRepo: Repository<ProgramCourses>): Promise<void> {
        this.programCourseRepository = programCourseRepo
        console.log("ProgramCourseService repositories initialized.");
    }

   
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param programCourseDto The DTO containing the data for the new programCourse.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created ProgramCourse.
     */
    async createProgramCourse(programCourseDto: CreateProgramCourseRequestDto, manager?: EntityManager): Promise<ProgramCourses> {
        // This is a concise and correct way to get the right repository.
        const repo = manager ? manager.getRepository(ProgramCourses) : this.programCourseRepository;

        // --- THIS IS THE KEY LINE TO AVOID MANUAL ASSIGNMENT ---
        // TypeORM's `create` method takes a plain object (our DTO) and returns a new
        // entity instance with all the properties correctly mapped.
        const newProgramCourse = repo.create(programCourseDto);
        
        return repo.save(newProgramCourse);
    }

    /**
     * Updates an existing ProgramCourse with the given data.
     * @param id The ID of the programCourse to update.
     * @param programCourseDto The DTO containing the data for the programCourse update.
     * @returns A Promise of the updated ProgramCourse entity.
     */
    async updateProgramCourse(id: number, programCourseDto: UpdateProgramCourseRequestDto): Promise<ProgramCourses> {
        const programCourse = await this.programCourseRepository.findOneBy({ id });
        
        if (!programCourse) {
            throw new Error('ProgramCourse not found');
        }

        // Object.assign is a great way to merge the DTO properties into the entity.
        // It avoids manual, property-by-property assignment.
        Object.assign(programCourse, programCourseDto);

        return this.programCourseRepository.save(programCourse);
    }

    /**
     * Deletes a ProgramCourse by its ID.
     * @param id The ID of the programCourse to delete.
     * @returns A Promise that resolves once the programCourse is deleted.
     */
    async deleteProgramCourse(id: number): Promise<void> {
        const programCourse = await this.programCourseRepository.findOneBy({ id });
        
        if (!programCourse) {
            throw new Error('ProgramCourse not found');
        }
        
        await this.programCourseRepository.remove(programCourse);
    }

    /**
     * Retrieves all ProgramCourse records from the database.
     * @returns An array of ProgramCourse entities.
     */
    getProgramCourses = async (
        activeTenantId: string,
        manager?: EntityManager): Promise<ProgramCourses[]> => {
        if (!this.programCourseRepository) {
            throw new Error("ProgramCourseService repository not initialized. Call init() first.");
        }
        const programCourseRepository = manager ? manager.getRepository(ProgramCourses) : this.programCourseRepository;
      
        
        return await programCourseRepository.find({where:{tenantId:activeTenantId},relations:['program','course']}); // Use find() to get all
    }

    
    async getById(id: number
        ,manager?: EntityManager): Promise<ProgramCourses[] | undefined> {
        if (!this.programCourseRepository) {
            throw new Error("ProgramCourseService repository not initialized. Call init() first.");
        }
        const programCourseRepository = manager ? manager.getRepository(ProgramCourses) : this.programCourseRepository;
        
        var aprogramCourse = await programCourseRepository.find({
            where: { programId: id },relations:['program','course']
            
           
        });

        if (aprogramCourse) {
            return aprogramCourse;
        }
        return undefined;
    }

}



export default ProgramCourseService;