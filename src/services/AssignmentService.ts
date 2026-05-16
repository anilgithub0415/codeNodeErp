// src/services/AssignmentService.ts
// Use ES Module imports consistently
import { Repository,EntityManager, And } from 'typeorm'; // Import Repository directly for init method
import { Assignment,  } from '../entity/Assignment'; // Import Assignment entity and its enums
import { CreateAssignmentDto, UpdateAssignmentDto } from '../Models/Assignment.interfaces';
import { AssignmentQuestion } from '../entity/AssignmentQuestion';
import { AppDataSource } from '../../data-source';


class AssignmentService {
    private assignmentRepository!: Repository<Assignment>; // Will be set by init method
  
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the AssignmentService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Assignment.
     */
    async init(assignmentRepo: Repository<Assignment>): Promise<void> {
        this.assignmentRepository = assignmentRepo;
       
        console.log("AssignmentService repositories initialized.");
    }

   
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param assignmentDto The DTO containing the data for the new assignment.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created Assignment.
     */
   
    //manually assigned properties as it was giving error while saving 'courseOfferingId'
    async createAssignment(assignmentDto: CreateAssignmentDto, manager?: EntityManager): Promise<Assignment> {
          // Use the provided EntityManager or create a new transaction if none is provided.
        // This ensures the entire operation is atomic.
console.log('creating assgnmt:',assignmentDto);

        const transactionalEntityManager = manager || AppDataSource.manager;
      
        return await transactionalEntityManager.transaction(async (em: EntityManager) => {
            // Step 1: Create and save the main Assignment entity.
            const newAssignment = em.create(Assignment, {
                tenantId: assignmentDto.tenantId,
                assignmentName: assignmentDto.assignmentName,
                assignmentPurpose:assignmentDto.assignmentPurpose,
                description: assignmentDto.description,
                courseOfferingId: (assignmentDto as any).courseOfferingId,
                // The dueDate and visibilityDate strings are now directly used
                // with the Date constructor.
                dueDate: new Date(`${assignmentDto.dueDate}T00:00:00Z`),
                visibilityDate: new Date(`${assignmentDto.visibilityDate}T00:00:00Z`),
                assignmentType: assignmentDto.assignmentPurpose, 

                quizTimeLimitSeconds:assignmentDto.quizTimeLimitSeconds,
                questionTimeLimitSeconds:assignmentDto.questionTimeLimitSeconds  
            });

            const savedAssignment = await em.save(newAssignment);

            // Step 2: Map the questions from the DTO to AssignmentQuestion entities.
            const assignmentQuestions = assignmentDto.assignmentQuestions.map(q => {
                const aq = new AssignmentQuestion();
                aq.assignmentId = savedAssignment.id;
                aq.questionId = q.questionId;
                aq.points = q.points;
                aq.orderInAssignment = q.orderInAssignment;
                aq.tenantId = savedAssignment.tenantId;
                return aq;
            });

            // Step 3: Save all AssignmentQuestion entities in a single batch.
            await em.save(AssignmentQuestion, assignmentQuestions);

            // Step 4: Return the saved assignment.
            return savedAssignment;
    })
}

    /**
     * Updates an existing Assignment with the given data.
     * @param id The ID of the assignment to update.
     * @param assignmentDto The DTO containing the data for the assignment update.
     * @returns A Promise of the updated Assignment entity.
     */
    // async updateAssignment(id: number, assignmentDto: UpdateAssignmentDto): Promise<Assignment> {
    //     const assignment = await this.assignmentRepository.findOneBy({ id });
        
    //     if (!assignment) {
    //         throw new Error('Assignment not found');
    //     }

    //     console.log('updating assignment by object:',assignmentDto);
        
    //     // Object.assign is a great way to merge the DTO properties into the entity.
    //     // It avoids manual, property-by-property assignment.
    //     Object.assign(assignment, assignmentDto);

    //     return this.assignmentRepository.save(assignment);
    // }

    
    
    async updateAssignment(id: number, assignmentDto: UpdateAssignmentDto): Promise<Assignment> {
        console.log('............. updating assignment:',assignmentDto);
        
        // Start a new transaction to ensure data integrity
        return await AppDataSource.manager.transaction(async (em: EntityManager) => {
            // Step 1: Find the existing Assignment entity.
            const assignmentRepository = em.getRepository(Assignment);
            const assignment = await assignmentRepository.findOneBy({ id });

            if (!assignment) {
                throw new Error('Assignment not found');
            }

            // --- CRITICAL FIX: Destructure the DTO to safely update the assignment ---
            const { assignmentQuestions,  ...assignmentData } = assignmentDto;
console.log('---------->only',assignmentData);

            // Step 2: Update the main properties of the Assignment safely.
            Object.assign(assignment, {
                ...assignmentData, // Only spread the properties that belong to the Assignment entity
                dueDate: assignmentData.dueDate ? new Date(`${assignmentData.dueDate}T00:00:00Z`) : assignment.dueDate,
                visibilityDate: assignmentData.visibilityDate ? new Date(`${assignmentData.visibilityDate}T00:00:00Z`) : assignment.visibilityDate,
            });

            const updatedAssignment = await em.save(assignment);

            // Step 3: Manage the associated AssignmentQuestion entities.
            // First, delete all existing questions for this assignment.
            const assignmentQuestionRepository = em.getRepository(AssignmentQuestion);
            await assignmentQuestionRepository.delete({ assignmentId: updatedAssignment.id });

            // Step 4: Create and save the new set of AssignmentQuestion entities.
            if (assignmentQuestions && assignmentQuestions.length > 0) {
                const newAssignmentQuestions = assignmentQuestions.map(q => {
                    const newQuestion = new AssignmentQuestion();
                    newQuestion.assignmentId = id; 
                    newQuestion.questionId = q.questionId;
                    newQuestion.points = q.points;
                    newQuestion.orderInAssignment = q.orderInAssignment;
                    newQuestion.tenantId = updatedAssignment.tenantId;
                    return newQuestion;
                });

                await em.save(newAssignmentQuestions);
            }

            // Step 5: Return the fully updated assignment.
            return updatedAssignment;
        });
    }
    /**
     * Deletes a Assignment by its ID.
     * @param id The ID of the assignment to delete.
     * @returns A Promise that resolves once the assignment is deleted.
     */
    async deleteAssignment(id: number): Promise<void> {
        const assignment = await this.assignmentRepository.findOneBy({ id });
        
        if (!assignment) {
            throw new Error('Assignment not found');
        }
        
        await this.assignmentRepository.remove(assignment);
    }
    /**
     * Retrieves all Assignment records from the database.
     * @returns An array of Assignment entities.
     */
    getAssignments = async (ptenantId:string,
        manager?: EntityManager): Promise<Assignment[]> => {
       
            
        if (!this.assignmentRepository) {
            throw new Error("AssignmentService repository not initialized. Call init() first.");
        }
        const assignmentRepository = manager ? manager.getRepository(Assignment) : this.assignmentRepository;
        console.log('returning assignments od tenantid:',ptenantId);
        
        return await assignmentRepository.find({where:{tenantId:ptenantId},relations:['courseOffering','assignmentQuestions']}); // Use find() to get all
    }





    getAssignmentsForStudent = async (
        ptenantId: string,
        studentProfileId: number,
        manager?: EntityManager
    ): Promise<Assignment[]> => {
console.log('.............getAssignmentsForStudent');

        const assignmentRepository = manager
            ? manager.getRepository(Assignment)
            : this.assignmentRepository;
        
        if (!assignmentRepository) {
            throw new Error("AssignmentService repository not initialized. Call init() first.");
        }

        console.log('Returning assignments for tenantId:', ptenantId, 'and studentProfileId:', studentProfileId);

        // Using QueryBuilder to efficiently join and filter at the database level
        return assignmentRepository.createQueryBuilder('assignment')
            .leftJoinAndSelect('assignment.courseOffering', 'courseOffering')
            .leftJoinAndSelect('assignment.assignmentAttempts', 'attempts', 'attempts.studentProfileId = :studentProfileId', { studentProfileId })
            .where('assignment.tenantId = :ptenantId', { ptenantId })
            .getMany();
    };
    
    

   
    
    
 getAssignmentsForFaculty = async (
    ptenantId: string,
    facultyProfileId: number,
    manager?: EntityManager
): Promise<Assignment[]> => {
    // Determine the repository to use, either the transactional one or the global one
    const assignmentRepository = manager 
        ? manager.getRepository(Assignment)
        : this.assignmentRepository; // Assuming this is part of a class
    
    if (!assignmentRepository) {
        throw new Error("AssignmentService repository not initialized. Call init() first.");
    }

    // Use QueryBuilder to perform a series of optimized joins to get all the data in one query
    return assignmentRepository.createQueryBuilder('assignment')
        // Join to CourseOffering to filter by faculty ID.
        // ASSUMPTION: The CourseOffering entity has a 'facultyProfileId' column.
        .leftJoin('assignment.courseOffering', 'courseOffering')
        // Join to AssignmentAttempt to get all submitted attempts for each assignment
        .leftJoinAndSelect('assignment.assignmentAttempts', 'attempts')
        // Join the attempts to the StudentProfile to get the student's details
        .leftJoinAndSelect('attempts.studentProfile', 'studentProfile')
        .leftJoinAndSelect('studentProfile.person', 'studentProfileperson')
        // Join the attempts to the StudentQuestionAnswer to get the submitted answers
        .leftJoinAndSelect('attempts.studentQuestionAnswers', 'answers')
        // Filter by the tenant and the faculty member's profile ID
        .where('assignment.tenantId = :ptenantId', { ptenantId })
        .andWhere('courseOffering.facultyProfileId = :facultyProfileId', { facultyProfileId })
        // Use .getMany() to return an array of assignments with all the eagerly loaded relations
        .getMany();
};


    async getById(id: number
        ,manager?: EntityManager): Promise<Assignment | undefined> {
            
        if (!this.assignmentRepository) {
            throw new Error("AssignmentService repository not initialized. Call init() first.");
        }
        const assignmentRepository = manager ? manager.getRepository(Assignment) : this.assignmentRepository;
        
        var aassignment = await assignmentRepository.findOne({
            where: { id: id }
            ,relations:['assignmentQuestions','assignmentQuestions.question.options']//removed relations: 'courseOffering' if u need add it
            
           
        });

        if (aassignment) {
            return aassignment;
        }
        return undefined;
    }

    
    

}



export default AssignmentService;