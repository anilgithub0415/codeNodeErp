// src/services/EnrollService.ts
// Use ES Module imports consistently
import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method
import { Enrollment } from '../entity/Enrollment'; // Import Enroll entity and its enums
//import {CreateEnrollDto, UpdateEnrollDto}from '../Models/Enroll'



//import { BackendUpdateEnrollDto } from '../dto/tenant.dto';
// Or: import { generateUUID } from '../Special/helpers'; // If you put it here

export interface CreateEnrollInternalDTO{
    
    tenantId?: string;
StudentProfileId?: number;
studentProfile?:any;
programId?:number;
enrollmentDate?: Date;
status?: string;
completionDate?: Date;
CreatedByUserId?:number;
}
export class EnrollService {
    private EnrollRepository!: Repository<Enrollment>; // Will be set by init method
  
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the EnrollService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Enroll.
     */
    async init(EnrollRepo: Repository<Enrollment>): Promise<void> {
        this.EnrollRepository = EnrollRepo
        console.log("EnrollService repositories initialized.");
    }

   
    async CreateEnrollment(enrollData: CreateEnrollInternalDTO
        ,manager?: EntityManager): Promise<Enrollment> {

            console.log('creating enrollment record in personservice');
            
        if (!this.EnrollRepository ) {
            throw new Error("EnrollService repositories not initialized. Call init() first.");
        }
        if (!enrollData.studentProfile || !enrollData.enrollmentDate) {
            throw new Error('Enroll  student profile enrolldate are required.');
        }

       
        const enrollRepository = manager ? manager.getRepository(Enrollment) : this.EnrollRepository;
       

       
        const newEnroll = new Enrollment();
        newEnroll.tenantId = enrollData.tenantId!;
        newEnroll.programId=enrollData.programId!;
        newEnroll.studentProfileId = enrollData.studentProfile.id;
        newEnroll.enrollmentDate = enrollData.enrollmentDate || null;
        newEnroll.status=enrollData.status!;
        newEnroll.completionDate = enrollData.completionDate;
        newEnroll.programId=enrollData.programId!;
        newEnroll.status=enrollData.status!;

      
console.log('..................................');
        
newEnroll.createdByUserId=enrollData.CreatedByUserId;
 //pending , assigned personId statically 1
 
       
        console.log('finally adding enrollment:',newEnroll,' , where enrollData.ProgramId:',enrollData.programId);
        return await enrollRepository.save(newEnroll);
    }

    /**
     * Retrieves all Enroll records from the database.
     * @returns An array of Enroll entities.
     */
    getEnrolls = async (ptenantId:string,
        manager?: EntityManager): Promise<Enrollment[]> => {
        if (!this.EnrollRepository) {
            throw new Error("EnrollService repository not initialized. Call init() first.");
        }
        const EnrollRepository = manager ? manager.getRepository(Enrollment) : this.EnrollRepository;
        //pending- we have used relations to load related data
        //just crosscheck what will give performance leftjoinselect or relations
        return await EnrollRepository.find({
            where:{tenantId:ptenantId},
            relations:['studentProfile','studentProfile.person.user','program']
        })//{where:{tenantId:ptenantId}}); // Use find() to get all
    }

    
    async getById(id: number
        ,manager?: EntityManager): Promise<Enrollment | undefined> {
        if (!this.EnrollRepository) {
            throw new Error("EnrollService repository not initialized. Call init() first.");
        }
        const EnrollRepository = manager ? manager.getRepository(Enrollment) : this.EnrollRepository;
        
        var aEnroll = await EnrollRepository.findOne({
            where: { id: id }
            
           
        });

        if (aEnroll) {
            return aEnroll;
        }
        return undefined;
    }

}



export default EnrollService;