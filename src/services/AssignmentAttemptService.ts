//pending- StudentAssignmentAttempt (starttime,endtime) and AssignmentAttempt (currently using) are similar

// src/services/AssignmentAttemptService.ts
// Use ES Module imports consistently
import { Repository,EntityManager, And } from 'typeorm'; // Import Repository directly for init method
import { AssignmentAttempt,  } from '../entity/AssignmentAttempt'; // Import AssignmentAttempt entity and its enums
import { CreateAssignmentAttemptDto, UpdateAssignmentAttemptDto } from '../Models/AssignmentAttempt.interfaces';
 import { StudentQuestionAnswer } from '../entity/StudentQuestionAnswer';
import { AppDataSource } from '../../data-source';
import { Question } from '../entity/Question';
import { getQuestionRepository } from '../dependencies';

// Helper function to compare two arrays for equality
const arraysEqual = (a: any[], b: any[]): boolean => {
    if (a.length !== b.length) return false;
    // Sort and compare to handle different orderings
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    for (let i = 0; i < sortedA.length; i++) {
      if (sortedA[i] !== sortedB[i]) return false;
    }
    return true;
  };

class AssignmentAttemptService {
    private assignmentAttemptRepository!: Repository<AssignmentAttempt>; // Will be set by init method
    private studentQuestionAnswerRepository!:Repository<StudentQuestionAnswer>;

    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the AssignmentAttemptService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for AssignmentAttempt.
     */
    async init(assignmentAttemptRepo: Repository<AssignmentAttempt>,studQueAnswerRepo:Repository<StudentQuestionAnswer>): Promise<void> {
        this.assignmentAttemptRepository = assignmentAttemptRepo;
        this.studentQuestionAnswerRepository = studQueAnswerRepo;

        console.log("AssignmentAttemptService repositories initialized.");
    }

   
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param assignmentAttemptDto The DTO containing the data for the new assignmentAttempt.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created AssignmentAttempt.
     */
   
    //manually assigned properties as it was giving error while saving 'courseOfferingId'
    async createAssignmentAttempt(assignmentAttemptDto: CreateAssignmentAttemptDto, manager?: EntityManager): Promise<AssignmentAttempt> {
    
          // Use the provided EntityManager or create a new transaction if none is provided.
        // This ensures the entire operation is atomic.
console.log('creating assgnmtattemp:',assignmentAttemptDto);

        const transactionalEntityManager = manager || AppDataSource.manager;
      
        return await transactionalEntityManager.transaction(async (em: EntityManager) => {

          const questionRepository = em.getRepository(Question);

            // Step 1: Create and save the main AssignmentAttempt entity.
            const newAssignmentAttempt = em.create(AssignmentAttempt, {
                tenantId: assignmentAttemptDto.tenantId,
                studentProfileId: assignmentAttemptDto.studentProfileId,
                assignmentId: assignmentAttemptDto.assignmentId,
                submissionDate: assignmentAttemptDto.submissionDate,
                status:assignmentAttemptDto.status
                
            });

             
            const savedAssignmentAttempt = await em.save(newAssignmentAttempt);


            const { studentQuestionAnswers,  ...assignmentAttemptData } = assignmentAttemptDto;
            
          
      // Step 3: Fetch all required questions and their associated options in a single, optimized query.
      const questionIds = studentQuestionAnswers?.map(sqa => sqa.questionId!) || [];
      const questionsWithAnswers = await questionRepository
        .createQueryBuilder('question')
        .leftJoinAndSelect('question.options', 'option') // Assuming a 'options' relation on the Question entity
        .where('question.id IN (:...ids)', { ids: questionIds })
        .getMany();

      const questionsMap = new Map<number, Question>(questionsWithAnswers.map(q => [q.id, q]));


            // // Step 4: Create and save the new set of AssignmentQuestion entities.
             if (studentQuestionAnswers && studentQuestionAnswers.length > 0) {
                console.log('iterating studentQuestionAnswers');
                
                 const newStudQuesAnswers = studentQuestionAnswers.map(sqa => {
                     const newStudQA = new StudentQuestionAnswer();
                     newStudQA.assignmentAttemptId=savedAssignmentAttempt.id;
                      newStudQA.questionId = sqa.questionId!;
                     newStudQA.tenantId = savedAssignmentAttempt.tenantId;
                     newStudQA.studentAnswerContent=sqa.studentAnswerContent; console.log('sqa copying...',sqa.studentAnswerContent);
                     

                      
                     // Get the corresponding question from the map
                     const question = questionsMap.get(sqa.questionId!);

                     if (question) {
                       // Check the question type to determine the correct way to validate the answer
                       // Assuming your Question entity has a 'type' field (e.g., 'MCQ', 'Text', 'FillInTheBlank')
                       if (question.questionTypeName === 'MCQ-SingleCorrect' || question.questionTypeName === 'MCQ-MultiCorrect') {
                        console.log('....mcq question..............');
                        
                         // Get the correct answer(s) from the associated options
                         const correctOptions = question.options!.filter(opt => opt.isCorrect).map(opt => opt.optionText);
                         
                         // Handle both single- and multi-select MCQ student answers
                         const studentAnswersArray = Array.isArray(newStudQA.studentAnswerContent)
                           ? newStudQA.studentAnswerContent
                           : [newStudQA.studentAnswerContent];
           
                         // The student's answer must match ALL correct options, regardless of order
                         newStudQA.isCorrect = arraysEqual(studentAnswersArray, correctOptions);
           
                       } else {
                         // For non-MCQ questions, compare the student's answer to the `correctAnswer` field
                         newStudQA.isCorrect = newStudQA.studentAnswerContent === question.correctAnswer;
                       }
                     } else {
                       console.warn(`Question with ID ${sqa.questionId} not found.`);
                       newStudQA.isCorrect = false;
                     }
           
                     console.log(newStudQA);
                     //serialise before saving
                     // --- FIX: Conditionally serialize the answer content ---
                    if (Array.isArray(sqa.studentAnswerContent)) {
                      newStudQA.studentAnswerContent = JSON.stringify(sqa.studentAnswerContent);
                    } else {
                      newStudQA.studentAnswerContent = sqa.studentAnswerContent;
                    }
                    // --- END FIX ---
                     return newStudQA;
                 });

                 //pending- please uncomment below line
                 await em.save(newStudQuesAnswers); 
             }

            // Step 5: Return the fully updated assignment.
            return savedAssignmentAttempt;
    })
}

    /**
     * Updates an existing AssignmentAttempt with the given data.
     * @param id The ID of the assignment to update.
     * @param assignmentAttemptDto The DTO containing the data for the assignment update.
     * @returns A Promise of the updated AssignmentAttempt entity.
     */
     
    
    async updateAssignmentAttempt(id: number, assignmentAttemptDto: UpdateAssignmentAttemptDto): Promise<AssignmentAttempt> {
        console.log('............. updating assignment attempt:',assignmentAttemptDto);
        
        // Start a new transaction to ensure data integrity
        return await AppDataSource.manager.transaction(async (em: EntityManager) => {
            // Step 1: Find the existing AssignmentAttempt entity.
            const assignmentAttemptRepository = em.getRepository(AssignmentAttempt);
            const assignmentAttempt = await assignmentAttemptRepository.findOneBy({ id });
            const questionRepository = em.getRepository(Question);

            if (!assignmentAttempt) {
                throw new Error('AssignmentAttempt not found');
            }
          

            
             const { studentQuestionAnswers,  ...assignmentAttemptData } = assignmentAttemptDto;
 console.log('---------->only',assignmentAttemptData);

            
            // Step 2: Update the main properties of the AssignmentAttempt safely.
            Object.assign(assignmentAttempt, {
                ...assignmentAttemptData, // Only spread the properties that belong to the Assignment entity
                
            });
            console.log('.......atleast main object assigned');
            
 // --- CRITICAL FIX: Destructure the DTO to safely update the assignmentAttempt ---

            const updatedAssignmentAttempt = await em.save(assignmentAttempt);

            // Step 3: Manage the associated AssignmentQuestion entities.
            // First, delete all existing studentQuestionAnswers for this assignmentAttempt.
            const studentQuestionAnswerRepository = em.getRepository(StudentQuestionAnswer);
            await studentQuestionAnswerRepository.delete({ assignmentAttemptId: updatedAssignmentAttempt.id });

      // Step 3: Fetch all required questions and their associated options in a single, optimized query.
      const questionIds = studentQuestionAnswers?.map(sqa => sqa.questionId!) || [];
      const questionsWithAnswers = await questionRepository
        .createQueryBuilder('question')
        .leftJoinAndSelect('question.options', 'option') // Assuming a 'options' relation on the Question entity
        .where('question.id IN (:...ids)', { ids: questionIds })
        .getMany();

      const questionsMap = new Map<number, Question>(questionsWithAnswers.map(q => [q.id, q]));


            // // Step 4: Create and save the new set of AssignmentQuestion entities.
             if (studentQuestionAnswers && studentQuestionAnswers.length > 0) {
                console.log('iterating studentQuestionAnswers');
                
                 const newStudQuesAnswers = studentQuestionAnswers.map(sqa => {
                     const newStudQA = new StudentQuestionAnswer();
                    newStudQA.assignmentAttemptId = id; 
                     newStudQA.questionId = sqa.questionId!;
                     newStudQA.tenantId = updatedAssignmentAttempt.tenantId;
                     newStudQA.studentAnswerContent=sqa.studentAnswerContent;

                      
                     // Get the corresponding question from the map
                     const question = questionsMap.get(sqa.questionId!);

                     if (question) {
                       // Check the question type to determine the correct way to validate the answer
                       // Assuming your Question entity has a 'type' field (e.g., 'MCQ', 'Text', 'FillInTheBlank')
                       if (question.questionTypeName === 'MCQ-SingleCorrect' || question.questionTypeName === 'MCQ-MultiCorrect') {
                        console.log('....mcq question..............');
                        
                         // Get the correct answer(s) from the associated options
                         const correctOptions = question.options!.filter(opt => opt.isCorrect).map(opt => opt.optionText);
                         
                         // Handle both single- and multi-select MCQ student answers
                         const studentAnswersArray = Array.isArray(newStudQA.studentAnswerContent)
                           ? newStudQA.studentAnswerContent
                           : [newStudQA.studentAnswerContent];
           
                         // The student's answer must match ALL correct options, regardless of order
                         newStudQA.isCorrect = arraysEqual(studentAnswersArray, correctOptions);
           
                       } else {
                         // For non-MCQ questions, compare the student's answer to the `correctAnswer` field
                         newStudQA.isCorrect = newStudQA.studentAnswerContent === question.correctAnswer;
                       }
                     } else {
                       console.warn(`Question with ID ${sqa.questionId} not found.`);
                       newStudQA.isCorrect = false;
                     }
           
                     console.log(newStudQA);
                     //serialise before saving
                     // --- FIX: Conditionally serialize the answer content ---
                    if (Array.isArray(sqa.studentAnswerContent)) {
                      newStudQA.studentAnswerContent = JSON.stringify(sqa.studentAnswerContent);
                    } else {
                      newStudQA.studentAnswerContent = sqa.studentAnswerContent;
                    }
                    // --- END FIX ---
                     return newStudQA;
                 });

                 //pending- please uncomment below line
                 await em.save(newStudQuesAnswers); 
             }

            // Step 5: Return the fully updated assignment.
            return updatedAssignmentAttempt;
        });
    }
    

    /**
     * Deletes a Assignment by its ID.
     * @param id The ID of the assignment to delete.
     * @returns A Promise that resolves once the assignment is deleted.
     */
    // async deleteAssignmentAttempt(id: number): Promise<void> {
    //     const assignment = await this.assignmentRepository.findOneBy({ id });
        
    //     if (!assignment) {
    //         throw new Error('AssignmentAttempt not found');
    //     }
        
    //     await this.assignmentRepository.remove(assignment);
    // }
    /**
     * Retrieves all AssignmentAttempt records from the database.
     * @returns An array of AssignmentAttempt entities.
     */
    // getAssignmentAttempts = async (ptenantId:string,
    //     manager?: EntityManager): Promise<AssignmentAttempt[]> => {
       
            
    //     if (!this.assignmentRepository) {
    //         throw new Error("AssignmentAttemptService repository not initialized. Call init() first.");
    //     }
    //     const assignmentRepository = manager ? manager.getRepository(AssignmentAttempt) : this.assignmentRepository;
    //     console.log('returning assignments od tenantid:',ptenantId);
        
    //     return await assignmentRepository.find({where:{tenantId:ptenantId},relations:['courseOffering','assignmentQuestions']}); // Use find() to get all
    // }

    async getReviewResultOfAssignmentAttempt(passignmentAttemptId:number,ptenantid:string
           ,manager?: EntityManager){


                   if (!this.studentQuestionAnswerRepository) {
            throw new Error("AssignmentAttemptService repository not initialized. Call init() first.");
        }
        const studentQuestionAnswerRepository = manager ? manager.getRepository(StudentQuestionAnswer) : this.studentQuestionAnswerRepository;
      
        //studentanswers----------------------------------------------------------------------
         var stud_quesanswers = await studentQuestionAnswerRepository.find({
          // select:{
          //   studentAnswerContent:true, isCorrect:true
          // },
             where: { assignmentAttemptId: passignmentAttemptId } ,relations:['question']
         });



         //-------count total, correct, incorrect, percentage -----------------------------------------
          var counttotal=await studentQuestionAnswerRepository.count ({
            where: {assignmentAttemptId: passignmentAttemptId  }
          
          });
       
          var countCorrect=await studentQuestionAnswerRepository.count ({
            where: {assignmentAttemptId: passignmentAttemptId ,isCorrect:true }
           
          });

          var countInCorrect=await studentQuestionAnswerRepository.count ({
            where: {assignmentAttemptId: passignmentAttemptId  ,isCorrect:false}
           
          });

          var result= {counttotal:counttotal, 
                  countCorrect:countCorrect, 
                  countInCorrect:countInCorrect, 
                  percentage:countCorrect/counttotal*100, 
                  resultString:countCorrect+' Correct from '+counttotal};
        

                  return {result:result,stud_quesanswers:stud_quesanswers };

    }

    
    async getById(id: number
        ,manager?: EntityManager): Promise<AssignmentAttempt | undefined> {
            
        if (!this.assignmentAttemptRepository) {
            throw new Error("AssignmentAttemptService repository not initialized. Call init() first.");
        }
        const assignmentAttemptRepository = manager ? manager.getRepository(AssignmentAttempt) : this.assignmentAttemptRepository;
        
        var aassignment = await assignmentAttemptRepository.findOne({
            where: { id: id }
            ,relations:['studentQuestionAnswers','studentQuestionAnswers.question']
            
           
        });

        if (aassignment) {
            return aassignment;
        }
        return undefined;
    }

    
    

}



export default AssignmentAttemptService;