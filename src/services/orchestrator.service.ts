//tip-: this service is used along with EnrollService
import { AppDataSource } from '../../data-source';
import { Person } from '../entity/Person';
import { StudentProfile } from '../entity/StudentProfile';
import { Enrollment } from '../entity/Enrollment';
import { PersonService} from './PersonService'
import { StudentProfileService } from './StudentProfileService';
import { EnrollService } from './EnrollService';
import { Repository } from 'typeorm';
import { getStudentProfileRepository,getPersonRepository, getEnrollRepository } from '../dependencies';
import { CreateStudentEnrollmentDto } from '../Models/Enrollment.interfaces';
import { StudentCourseOffering } from '../entity/StudentCourseOffering';

/**
 * This service orchestrates the enrollment process, providing different
 * entry points based on whether a person or student profile already exists.
 */
export class OrchestratorService {
    private personRepository!:Repository<Person>;
    private studentProfileRepository!:Repository<StudentProfile>;
    private EnrollRepository!: Repository<Enrollment>;
    constructor(
       // private personService = new PersonService(),
       // private studentProfileService = new StudentProfileService(),
      //  private enrollmentService = new EnrollService()
    ) {}
   /**
     * Initializes the EnrollService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Enroll.
     */
//    async init(PersonRepo:Repository<Person>,StudProfRepo:Repository<StudentProfile>,EnrollRepo: Repository<Enrollment>): Promise<void> {
//     this.personRepository=PersonRepo,this.studentProfileRepository=StudProfRepo,
//     this.EnrollRepository = EnrollRepo
//     console.log("EnrollService repositories initialized.");
// }
    /**
     * Handles the full enrollment process in a single transaction.
     * This method is flexible and determines the necessary steps based on the
     * provided parameters. It ensures atomicity for all operations.
     *
     * @param enrollmentData The data for the Enrollment record.
     * @param personData Optional. Data for a new person if they don't exist.
     * @param existingPersonId Optional. The ID of an existing person.
     * @param existingStudentProfileId Optional. The ID of an existing student profile.
     * @returns The newly created Enrollment.
     */
    async transactionalEnrollment({
        enrollmentData,
        personData,activeTenantId,
        existingPersonId,
        existingStudentProfileId
    }: {
        enrollmentData: CreateStudentEnrollmentDto,
        personData?: any,activeTenantId:string,
        existingPersonId?: number,
        existingStudentProfileId?: number
    }): Promise<Enrollment> {
        return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
            const studentProfileService = getStudentProfileRepository(); 
            const personService=getPersonRepository();
            const enrollmentService=getEnrollRepository()

            console.log('--- Initiating transactional enrollment ---');

            let person: Person;
            let studentProfile: StudentProfile;

            // --- SCENARIO 1: A Student Profile already exists ---
            if (existingStudentProfileId) {
                console.log(`> Path 1: Found existing StudentProfile with ID: ${existingStudentProfileId}. Skipping creation.`);
                
               
                const foundStudentProfile = await studentProfileService.getStudentProfileById(

                    existingStudentProfileId,activeTenantId,
                    transactionalEntityManager
                );
                if (!foundStudentProfile) {
                    throw new Error(`StudentProfile with ID ${existingStudentProfileId} not found.`);
                }
                studentProfile = foundStudentProfile;
                person = studentProfile.person; // Assume StudentProfile has a 'person' relation
            } 
            
            // --- SCENARIO 2: A Person exists, but no Student Profile exists ---
            else if (existingPersonId) {
                console.log(`> Path 2: Found existing Person with ID: ${existingPersonId}. Checking for StudentProfile.`);

               
                const foundPerson = await personService.getPersonById(existingPersonId, transactionalEntityManager);
                if (!foundPerson) {
                    throw new Error(`Person with ID ${existingPersonId} not found.`);
                }
                person = foundPerson;

                // Check if a student profile already exists for this person
                let foundStudentProfile = await studentProfileService.getStudentProfileByPersonId(
                    person.id,activeTenantId, 
                    transactionalEntityManager
                );

                if (foundStudentProfile) {
                    console.log(`> A StudentProfile already exists for this Person.`);
                    studentProfile = foundStudentProfile;
                } else {
                    console.log(`> Creating new StudentProfile for existing Person.`);
                    // Create the Student Profile for that existing Person
                    studentProfile = await studentProfileService.createStudentProfileWithAutoId(//.CreateStudentProfile(
                        { ...personData, person: person }, // Link the profile to the person
                        transactionalEntityManager
                    );
                }
            } 
            
            // --- SCENARIO 3: Neither Person nor Student Profile exists (full creation) ---
            else if (personData) {
                console.log(`> Path 3: Neither Person nor StudentProfile exists. Performing full creation.`);
                // 1. Create the Person
                person = await personService.CreatePerson(personData, transactionalEntityManager);
                // 2. Create the Student Profile for that Person
                studentProfile = await studentProfileService.createStudentProfileWithAutoId(//.CreateStudentProfile(
                    { ...personData, person: person },
                    transactionalEntityManager
                );
            } else {
                throw new Error("Invalid request: Must provide existing IDs or new person data.");
            }

            // --- FINAL STEP: Create the Enrollment with the Student Profile ---
            console.log(`> Finalizing Enrollment for StudentProfile ID: ${studentProfile.id}`);
        // 1. Create the master Enrollment record
        const newEnrollmentData = transactionalEntityManager.create(Enrollment, {
            ...enrollmentData,
            studentProfileId: studentProfile.id, // Explicitly assign the ID
            studentProfile: studentProfile, // Also link the object for relations
            createdByUserId: enrollmentData.createdByUserId || null // Handle this from the request body
        });

        const enrollment = await transactionalEntityManager.save(newEnrollmentData);

        // 2. Create the associated StudentCourseOffering records
        if (enrollmentData.studentCourseOfferings && enrollmentData.studentCourseOfferings.length > 0) {
            console.log(`> Creating ${enrollmentData.studentCourseOfferings.length} StudentCourseOffering records.`);
            
            // Create a list of entities to save
            const studentOfferingsToSave = enrollmentData.studentCourseOfferings.map(scoDto => {
                const studentOfferingEntity = new StudentCourseOffering();
                studentOfferingEntity.tenantId = enrollmentData.tenantId; // Inherit tenantId
                studentOfferingEntity.studentProfileId = studentProfile.id; // Link to the created profile
                studentOfferingEntity.courseOfferingId = scoDto.courseOfferingId;
                studentOfferingEntity.assignmentDate = scoDto.assignmentDate || new Date();
                studentOfferingEntity.status = scoDto.status || 'Active'; // Default status
                return studentOfferingEntity;
            });
            
            // Save all student course offerings in one go
            await transactionalEntityManager.save(studentOfferingsToSave);
        }
        
        // Re-fetch the enrollment with relations if needed, or just return the base record
        // For now, we'll return the base record.
        
        console.log('--- Transactional enrollment successful ---');
        return enrollment;
    });
    }
}