// src/services/ProgramService.ts
// Use ES Module imports consistently
import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method
import { Program } from '../entity/Program'; // Import Program entity and its enums
import { CreateProgramDto, UpdateProgramDto } from '../Models/Program.interfaces';
//import {CreateProgramDto, UpdateProgramDto}from '../Models/Program'



//import { BackendUpdateProgramDto } from '../dto/tenant.dto';
// Or: import { generateUUID } from '../Special/helpers'; // If you put it here


class ProgramService {
    private programRepository!: Repository<Program>; // Will be set by init method
  
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the ProgramService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Program.
     */
    async init(programRepo: Repository<Program>): Promise<void> {
        this.programRepository = programRepo
        console.log("ProgramService repositories initialized.");
    }

   
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param programDto The DTO containing the data for the new program.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created Program.
     */
    async createProgram(programDto: CreateProgramDto, manager?: EntityManager): Promise<Program> {
        // This is a concise and correct way to get the right repository.
        const repo = manager ? manager.getRepository(Program) : this.programRepository;

        // --- THIS IS THE KEY LINE TO AVOID MANUAL ASSIGNMENT ---
        // TypeORM's `create` method takes a plain object (our DTO) and returns a new
        // entity instance with all the properties correctly mapped.
        const newProgram = repo.create(programDto);
        
        return repo.save(newProgram);
    }

    /**
     * Updates an existing Program with the given data.
     * @param id The ID of the program to update.
     * @param programDto The DTO containing the data for the program update.
     * @returns A Promise of the updated Program entity.
     */
    async updateProgram(id: number, programDto: UpdateProgramDto): Promise<Program> {
        const program = await this.programRepository.findOneBy({ id });
        
        if (!program) {
            throw new Error('Program not found');
        }

        // Object.assign is a great way to merge the DTO properties into the entity.
        // It avoids manual, property-by-property assignment.
        Object.assign(program, programDto);

        return this.programRepository.save(program);
    }

    /**
     * Deletes a Program by its ID.
     * @param id The ID of the program to delete.
     * @returns A Promise that resolves once the program is deleted.
     */
    async deleteProgram(id: number): Promise<void> {
        const program = await this.programRepository.findOneBy({ id });
        
        if (!program) {
            throw new Error('Program not found');
        }
        
        await this.programRepository.remove(program);
    }

    /**
     * Retrieves all Program records from the database.
     * @returns An array of Program entities.
     */
    getPrograms = async (
        activeTenantId: string,
        manager?: EntityManager): Promise<Program[]> => {
        if (!this.programRepository) {
            throw new Error("ProgramService repository not initialized. Call init() first.");
        }
        const programRepository = manager ? manager.getRepository(Program) : this.programRepository;
      
        
        return await programRepository.find({where:{tenantId:activeTenantId}}); // Use find() to get all
    }

    
    async getById(id: number
        ,manager?: EntityManager): Promise<Program | undefined> {
        if (!this.programRepository) {
            throw new Error("ProgramService repository not initialized. Call init() first.");
        }
        const programRepository = manager ? manager.getRepository(Program) : this.programRepository;
        
        var aprogram = await programRepository.findOne({
            where: { id: id }
            
           
        });

        if (aprogram) {
            return aprogram;
        }
        return undefined;
    }

}



export default ProgramService;