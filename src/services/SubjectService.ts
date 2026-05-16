// src/services/SubjectService.ts
// Use ES Module imports consistently
import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method
import { Subject } from '../entity/Subject'; // Import Subject entity and its enums
import { CreateSubjectDto, UpdateSubjectDto } from '../Models/Subject.interfaces';
//import {CreateSubjectDto, UpdateSubjectDto}from '../Models/Subject'



//import { BackendUpdateSubjectDto } from '../dto/tenant.dto';
// Or: import { generateUUID } from '../Special/helpers'; // If you put it here

class SubjectService {
    private subjectRepository!: Repository<Subject>; // Will be set by init method
  
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the SubjectService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Subject.
     */
    async init(subjectRepo: Repository<Subject>): Promise<void> {
        this.subjectRepository = subjectRepo
        console.log("SubjectService repositories initialized.");
    }

   
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param subjectDto The DTO containing the data for the new subject.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created Subject.
     */
    async createSubject(subjectDto: CreateSubjectDto, manager?: EntityManager): Promise<Subject> {
        // This is a concise and correct way to get the right repository.
        const repo = manager ? manager.getRepository(Subject) : this.subjectRepository;

        // --- THIS IS THE KEY LINE TO AVOID MANUAL ASSIGNMENT ---
        // TypeORM's `create` method takes a plain object (our DTO) and returns a new
        // entity instance with all the properties correctly mapped.
        const newSubject = repo.create(subjectDto);
        
        return repo.save(newSubject);
    }

    
    /**
     * Updates an existing Subject with the given data.
     * @param id The ID of the subject to update.
     * @param subjectDto The DTO containing the data for the subject update.
     * @returns A Promise of the updated Subject entity.
     */
    async updateSubject(id: number, subjectDto: UpdateSubjectDto): Promise<Subject> {
                
        const subject = await this.subjectRepository.findOneBy({ id });
        
        if (!subject) {
            throw new Error('Subject not found');
        }

        // Object.assign is a great way to merge the DTO properties into the entity.
        // It avoids manual, property-by-property assignment.
        Object.assign(subject, subjectDto);

        return this.subjectRepository.save(subject);
    }

    
    /**
     * Deletes a Subject by its ID.
     * @param id The ID of the subject to delete.
     * @returns A Promise that resolves once the subject is deleted.
     */
    async deleteSubject(id: number): Promise<void> {
        const subject = await this.subjectRepository.findOneBy({ id });
        
        if (!subject) {
            throw new Error('Subject not found');
        }
        
        await this.subjectRepository.remove(subject);
    }
    /**
     * Retrieves all Subject records from the database.
     * @returns An array of Subject entities.
     */
    getSubjects = async (
        ptenantId: string,
        manager?: EntityManager): Promise<Subject[]> => {
            console.log('............m in subjectservice to get ');
            
        if (!this.subjectRepository) {
            throw new Error("SubjectService repository not initialized. Call init() first.");
        }
        const subjectRepository = manager ? manager.getRepository(Subject) : this.subjectRepository;
      
        console.log('returning subjects od tenantid:',ptenantId);
        return await subjectRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all
    }

    
    async getById(id: number
        ,manager?: EntityManager): Promise<Subject | undefined> {
        if (!this.subjectRepository) {
            throw new Error("SubjectService repository not initialized. Call init() first.");
        }
        const subjectRepository = manager ? manager.getRepository(Subject) : this.subjectRepository;
        
        var asubject = await subjectRepository.findOne({
            where: { id: id }
            
           
        });

        if (asubject) {
            return asubject;
        }
        return undefined;
    }

}



export default SubjectService;