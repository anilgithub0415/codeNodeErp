// src/services/ExamTypeService.ts
// Use ES Module imports consistently
import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method
import { ExamType } from '../entity/ExamType'; // Import ExamType entity and its enums
//import {CreateExamTypeDto, UpdateExamTypeDto}from '../Models/ExamType'



//import { BackendUpdateExamTypeDto } from '../dto/tenant.dto';
// Or: import { generateUUID } from '../Special/helpers'; // If you put it here


class ExamTypeService {
    private examtypeRepository!: Repository<ExamType>; // Will be set by init method
  
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the ExamTypeService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for ExamType.
     */
    async init(examtypeRepo: Repository<ExamType>): Promise<void> {
        this.examtypeRepository = examtypeRepo
        console.log("ExamTypeService repositories initialized.");
    }

   

    /**
     * Retrieves all ExamType records from the database.
     * @returns An array of ExamType entities.
     */
    getExamTypes = async (//ptenantId:string,
        manager?: EntityManager): Promise<ExamType[]> => {
        if (!this.examtypeRepository) {
            throw new Error("ExamTypeService repository not initialized. Call init() first.");
        }
        const examtypeRepository = manager ? manager.getRepository(ExamType) : this.examtypeRepository;
        return await examtypeRepository.find();//({where:{tenantId:ptenantId}}); // Use find() to get all
    }

    
    async getById(id: number
        ,manager?: EntityManager): Promise<ExamType | undefined> {
        if (!this.examtypeRepository) {
            throw new Error("ExamTypeService repository not initialized. Call init() first.");
        }
        const examtypeRepository = manager ? manager.getRepository(ExamType) : this.examtypeRepository;
        
        var aexamtype = await examtypeRepository.findOne({
            where: { id: id }
            
           
        });

        if (aexamtype) {
            return aexamtype;
        }
        return undefined;
    }

}



export default ExamTypeService;