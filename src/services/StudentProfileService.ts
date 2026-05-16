// src/services/StudentProfileService.ts
import { EntityManager, Not, Repository } from 'typeorm';
import { StudentProfile } from '../entity/StudentProfile';
import { Tenant } from '../entity/Tenant';
import { UpdatePersonDTO } from '../dto/CreatePerson.dto';
import { AppDataSource } from '../../data-source';

// // You will likely need a DTO for studentProfile creation if you don't use the full entity
interface CreateStudentProfileInternalDTO {
 
    tenantId: string;
    personId:number;
    studentIdNumber?:number;
    enrollmentStatus?:string;
    enrollmentDate:Date;
    createdByUserId:number;
}




export class StudentProfileService {
    private studentProfileRepository!: Repository<StudentProfile>;
   
    constructor() {
        // Constructor is lean, repositories will be set via init
    }

 
    async init(studentProfileRepo: Repository<StudentProfile> ): Promise<void> {
        this.studentProfileRepository = studentProfileRepo;
      
        console.log("StudentProfileService repositories initialized.");
    }

    //this is replaced by below new one
    async CreateStudentProfile_Notinuse(studentProfileData: CreateStudentProfileInternalDTO
        ,manager?: EntityManager): Promise<StudentProfile> {

            console.log('creating studentProfile record in studentProfileservice');
            
        if (!this.studentProfileRepository ) {
            throw new Error("StudentProfileService repositories not initialized. Call init() first.");
        }
        if (!studentProfileData.tenantId || !studentProfileData.personId) {
            throw new Error('StudentProfile tenantid, personid are required.');
        }

       
        const studentProfileRepository = manager ? manager.getRepository(StudentProfile) : this.studentProfileRepository;
              
        const newStudentProfile = new StudentProfile();
        newStudentProfile.tenantId = studentProfileData.tenantId;
        newStudentProfile.personId = studentProfileData.personId;
        newStudentProfile.enrollmentDate = studentProfileData.enrollmentDate;
        newStudentProfile.enrollmentStatus = studentProfileData.enrollmentStatus;
        newStudentProfile.studentIdNumber='2025-00002';   //pending- hard coded
        newStudentProfile.createdAt = new Date;
        newStudentProfile.updatedAt = new Date;

      
console.log('..................................');
        
newStudentProfile.createdByUserId=studentProfileData.createdByUserId;
 //pending , assigned studentProfileId statically 1
 
       
        console.log('finally adding studentProfile:',newStudentProfile);
        return await studentProfileRepository.save(newStudentProfile);
    }



    async createStudentProfileWithAutoId(profileData: Partial<StudentProfile>, manager?: EntityManager): Promise<StudentProfile> {
        // Use an existing manager or start a new transaction if none is provided.
        const runInTransaction = async (entityManager: EntityManager) => {
            const repo = entityManager.getRepository(StudentProfile);

            const currentYear = new Date().getFullYear();
            const tenantId = profileData.tenantId;

            // CRITICAL STEP: Find the highest existing number for this tenant and year.
            // We use `createQueryBuilder` to perform a custom MAX() aggregation
            // on the numeric part of the studentIdNumber.
            const lastStudentProfile = await repo.createQueryBuilder('sp')
                .select("MAX(CAST(SUBSTRING(sp.studentIdNumber, 6, 5) AS INT))", "maxNumber")
                .where("sp.tenantId = :tenantId", { tenantId: tenantId })
                .andWhere("sp.studentIdNumber LIKE :yearPrefix", { yearPrefix: `${currentYear}-%` })
                .getRawOne();
            
            const lastNumber = lastStudentProfile?.maxNumber || 0;
            const nextNumber = lastNumber + 1;

            // Format the new studentIdNumber as YYYY-NNNNN
            const nextIdNumber = `${currentYear}-${String(nextNumber).padStart(5, '0')}`;
            
            console.log(`[AutoCoding] Tenant ${tenantId}: Last ID was ${lastNumber}, new ID will be ${nextIdNumber}`);
            
            // Assign the new ID to the profile data
            profileData.studentIdNumber = nextIdNumber;
            //newStudentProfile.createdByUserId=profileData.createdByUserId
            console.log('........yes trying to save profile data:',profileData);
            const newStudentProfile = repo.create(profileData);
            
            
            return repo.save(newStudentProfile);
        };

        // If a manager is provided, run the logic directly with it.
        if (manager) {
            return runInTransaction(manager);
        } else {
            // Otherwise, start a new transaction to ensure atomicity.
            return AppDataSource.manager.transaction(runInTransaction);
        }
    }    
    
    // async updateStudentProfile(id: number, updateData: UpdateStudentProfileDTO
    //     ,manager?: EntityManager): Promise<StudentProfile | undefined> {
            
    //     if (!this.studentProfileRepository) {
    //         throw new Error("StudentProfileService repository not initialized. Call init() first.");
    //     }
    //     const studentProfileToUpdate = await this.studentProfileRepository.findOne({ where: { id: id } });
    //     if (!studentProfileToUpdate) {
    //         return undefined;
    //     }
    //     const studentProfileRepository = manager ? manager.getRepository(StudentProfile) : this.studentProfileRepository;
        

    //     Object.assign(studentProfileToUpdate, updateData); // Apply other updates

    //     return await studentProfileRepository.save(studentProfileToUpdate);
    // }



    async byIdOrPersonId_Notinuse(id: number,byIdOrPersonId: string,activeTenantId:string
        ,manager?: EntityManager): Promise<StudentProfile | undefined> {
        if (!this.studentProfileRepository) {
            throw new Error("SstudentProfileService repository not initialized. Call init() first.");
        }
        const studentProfileRepository = manager ? manager.getRepository(StudentProfile) : this.studentProfileRepository;
        var astudentProfile;
        if(byIdOrPersonId==='byPersonId'){
            astudentProfile = await studentProfileRepository.findOne({
                where: { tenantId:activeTenantId, personId: id } 
            });
           
        }
        else{
         astudentProfile = await studentProfileRepository.findOne({
            where: { id: id } 
        });
       }

        if (astudentProfile) {
            // If the user is found and tenant relation is loaded,
            // 'auser.tenant' will now contain the Tenant object,
            // from which you can access auser.tenant.tenantType.
            return astudentProfile;
        }
        return undefined;
    }

    async getStudentProfileById(id: number,activeTenantId:string
        , manager?: EntityManager): Promise<StudentProfile | null> {

            console.log('....getStudentProfileById:',id);
            
        if (!this.studentProfileRepository) {
            throw new Error("SstudentProfileService repository not initialized. Call init() first.");
        }
        const studentProfileRepository = manager ? manager.getRepository(StudentProfile) : this.studentProfileRepository;
        var  astudentProfile = await studentProfileRepository.findOne({
            where: { id: id } 
        });
       

        if (astudentProfile) {
            // If the user is found and tenant relation is loaded,
            // 'auser.tenant' will now contain the Tenant object,
            // from which you can access auser.tenant.tenantType.
            return astudentProfile;
        }
        return null;
    }
    
    async getStudentProfileByPersonId(personId: number,activeTenantId:string
        , manager?: EntityManager): Promise<StudentProfile | null> {

            console.log('....getStudentProfileByPersonId:',personId);
            
       
        if (!this.studentProfileRepository) {
            throw new Error("SstudentProfileService repository not initialized. Call init() first.");
        }
        const studentProfileRepository = manager ? manager.getRepository(StudentProfile) : this.studentProfileRepository;
        var astudentProfile = await studentProfileRepository.findOne({
                where: { tenantId:activeTenantId, personId: personId } 
            });
           
        
      

        if (astudentProfile) {
            // If the user is found and tenant relation is loaded,
            // 'auser.tenant' will now contain the Tenant object,
            // from which you can access auser.tenant.tenantType.
            return astudentProfile;
        }
        return null;
    }

    async getStudentProfiles(manager?: EntityManager): Promise<StudentProfile[]> {
                        
        if (!this.studentProfileRepository) {
            throw new Error("StudentProfileService repository not initialized. Call init() first.");
        }

        const personRepository = manager ? manager.getRepository(StudentProfile) : this.studentProfileRepository;

    
        

        // Default case: retrieve all persons for the given tenantId
        return await personRepository.find();

    }
    
    // async getStudentProfiles(manager?: EntityManager): Promise<StudentProfile[]> {
    //     console.log('Executing getPersons with custom sorting...');

    //     const studentProfileRepository = manager ? manager.getRepository(StudentProfile) : this.studentProfileRepository;

    //     // Define the CASE WHEN expressions for clarity and reusability
    //     const noTenantContextPriority = `CASE WHEN userTenantContext.id IS NULL THEN 0 ELSE 1 END`;
    //     const isStudentPriority = `CASE WHEN studentProfile.id IS NOT NULL THEN 0 ELSE 1 END`;

    //     const studentProfiles = await studentProfileRepository.createQueryBuilder('studentProfile')
    //         .leftJoinAndSelect('studentProfile.user', 'user')
    //         .leftJoin('user.userTenantContexts', 'userTenantContext') // Join to check for contexts
    //         .leftJoinAndSelect('studentProfile.studentProfile', 'studentProfile')
                        
    //         // --- FIX: Use the full CASE WHEN expression directly in addOrderBy ---
    //         .orderBy(noTenantContextPriority, 'ASC') // First, prioritize those with no tenant context
    //         .addOrderBy(isStudentPriority, 'ASC')     // Then, prioritize students
    //         .addOrderBy('studentProfile.firstName', 'ASC')    // Then, by first name
    //         .addOrderBy('studentProfile.lastName', 'ASC')     // Finally, by last name
    //         .getMany();

    //     console.log('getPersons completed. Found', studentProfiles.length, 'studentProfiles.');
    //     return studentProfiles;
    // }
    

}

export default StudentProfileService; // Export the CLASS