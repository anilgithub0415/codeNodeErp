// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getQuestionRepository,getQuestionOrchestrationRepository, getQuestionOptionRepository } from '../../dependencies'; // <--- Get the service via getter
import { CreateQuestionDto, UpdateQuestionDto } from '../../Models/Question.interfaces';

// // Import types for request bodies and enums for type safety
// //import { userRole } from '../../entity/User'; // Assuming UserRole is exported from User entity file
// import { UserRoleLookup } from '../../entity/UserRoleLookup';
// import { UpdateUserDTO } from '../../dto/CreateUser.dto';

// // Define interfaces for request bodies
// interface CreateUserRequestBody {
//     firstName: string;  
//     lastName: string;  
//     contactEmail: string;  
//     contactPhone:string;
//     initialTenantId: string;  
//     initialRoleName: string;//earlier UserRoleLookup;  
//     deviceInfo : string;
//     userName: string;
//     password: string;
//     displayName?: string;
//     role: UserRoleLookup;//userRole;//changed
//     tenantId: string; // Tenant ID is crucial for user creation now
//     googleId?: string;
// }

// interface UpdateUserRequestBody {
//     userName?: string;
//     displayName?: string;
//     password?: string;
//     role?: any;//UserRoleLookup;//userRole;//changed enum to lookup
//     isActive?: boolean;
//     isEmailVerified?: boolean;
// }


const router = Router();

router.route('')
    .post(async (req: Request<{}, {}, CreateQuestionDto>, res: Response) => {
        try {
            const questionService = getQuestionRepository(); // <--- Get the singleton instance from dependencies.ts
            const questionOrchestrationService=getQuestionOrchestrationRepository();
            // Basic validation
            if (!req.body.tenantId ||!req.body.questionText ||!req.body.questionCategoryName||!req.body.questionTypeName||!req.body.questionPurposeName
                  ) {
           
               console.log('Basic validation fail like tenantid, questionText, questionCategoryName questionTypeName questionPurposeName missing');
               
            }
  
        var question;
            const questionDataFromRequest = req.body;
            if(questionDataFromRequest.questionTypeName==='Descriptive' || questionDataFromRequest.questionTypeName==='Numerical') {
       console.log('...... m saving Descriptive/Numerical question');
       
             question = await questionService.createQuestion(questionDataFromRequest);
            }
            else if(questionDataFromRequest.questionTypeName==='MCQ-MultiCorrect' || questionDataFromRequest.questionTypeName==='MCQ-SingleCorrect') {
            
                 question = await questionOrchestrationService.createQuestionWithTransaction(questionDataFromRequest);
console.log(' .......in question controller question is:',question);

            }

            res.status(201).json(question);
        } catch (error: any) {
            console.error('Question creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Question creation failed: ' + error.message });
        }
    })

//--merge question from question bank----------------------------------------------------------------------------------------------------------

router.route('/merge/:id/:tenantid')
    .post(async (req: Request<{id:number,tenantid:string}, {}, CreateQuestionDto>, res: Response) => {
        try {
            const questionService = getQuestionRepository(); // <--- Get the singleton instance from dependencies.ts
            var qid=req.params.id;
            var tid=req.params.tenantid;
  
        var question;
        
        
             question = await questionService.mergeQuestionToTenant(qid,tid);
        
            res.status(201).json(question);
        } catch (error: any) {
            console.error('Question creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Question creation failed: ' + error.message });
        }
    })
//------------------------------------------------------------------------------------------------------------
// --- PUT & DELETE: Endpoints targeting a specific question by ID ---
router.route('/:id')
    // --- PUT: Update a question by ID ---
    .put(async (req: Request<{ id: string }, {}, UpdateQuestionDto>, res: Response) => {
               
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid question ID.' });
            }

            const questionService = getQuestionRepository();
            const updatedQuestion = await questionService.updateQuestion(id, req.body);

            res.status(200).json(updatedQuestion);
        } catch (error: any) {
            console.error('Question update failed:', error.message || error);
            if (error.message === 'Question not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: 'Question update failed: ' + error.message });
        }
    })
    
    router.route('/')
    .get(async (req: Request, res: Response) => {
        try {
            
            const questionService = getQuestionRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
         
        
            const questions = await questionService.getQuestions(activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(questions);
        } catch (error: any) {
            console.error('Failed to retrieve questions:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve questions: " + error.message });
        }
    });
 
    router.route('/types')
    .get(async (req: Request, res: Response) => {
        console.log('hitting ques types..........................');
        
        try {
            const questionService = getQuestionRepository();
            const types = await questionService.getQuestionTypes(); // This method needs to be implemented in TenantService
            res.status(200).json(types.map(q => q.typeName)); // Send back just the string names
        } catch (error: any) {
            console.error('Failed to retrieve QuestionTypes:', error.message || error);
            res.status(500).json({ message: 'Failed to retrieve QuestionTypes.' });
        }
    });
    

    router.route('/categories')
    .get(async (req: Request, res: Response) => {
        console.log('hitting ques ctegories..........................');
        try {
            const questionService = getQuestionRepository();
            const types = await questionService.getQuestionCategories(); // This method needs to be implemented in TenantService
            res.status(200).json(types.map(q => q.categoryName)); // Send back just the string names
        } catch (error: any) {
            console.error('Failed to retrieve QuestionCategories:', error.message || error);
            res.status(500).json({ message: 'Failed to retrieve QuestionCategories.' });
        }
    });
 
    router.route('/purposes')
    .get(async (req: Request, res: Response) => {
        console.log('hitting ques purposes..........................');
        
        try {
            const questionService = getQuestionRepository();
            const types = await questionService.getQuestionPurposes(); // This method needs to be implemented in TenantService
            res.status(200).json(types.map(q => q.purposeName)); // Send back just the string names
        } catch (error: any) {
            console.error('Failed to retrieve QuestionPurposes:', error.message || error);
            res.status(500).json({ message: 'Failed to retrieve QuestionPurposes.' });
        }
    });
  //question options
   router.route('/options/:id')
  .get(async (req: Request, res: Response) => {
    
      var quid=req.params.id;
      console.log('hitting get ques optionss for a quesId..........................',quid);
      var questionId= parseInt(quid);
      try {
          const optionService = getQuestionOptionRepository();
          const qoptions = await optionService.getOptionsOfQuestion(questionId); // This method needs to be implemented in TenantService
          res.status(200).json(qoptions); // Send back just the string names
      } catch (error: any) {
          console.error('Failed to retrieve QuestionPurposes:', error.message || error);
          res.status(500).json({ message: 'Failed to retrieve QuestionPurposes.' });
      }
  });
 
    
router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const questionService = getQuestionRepository(); // <--- Get the singleton instance from dependencies.ts
            const questionId = parseInt(req.params.id, 10);
            if (isNaN(questionId)) {
            //    return res.status(400).json({ message: 'Invalid Question ID format.' });
            }
            
            const question = await questionService.getById(questionId);
            
            if (question) {            
               
                res.status(200).json(question);
            } else {
                res.status(404).json({ 'message': 'Question not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve question by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving question.' });
        }
    })

    

//     .put(async (req: Request<{ id: string }, {}, UpdateQuestionDTO>, res: Response) => { //UpdateQuestionRequestBody
//         const questionId = parseInt(req.params.id, 10);
//         if (isNaN(questionId)) {
//           //  return res.status(400).json({ message: 'Invalid Question ID format.' });
//         }
//         try {
                   
//             const questionService = getQuestionRepository(); // <--- Get the singleton instance from dependencies.ts
//             const updatedQuestion = await questionService.updateQuestion(questionId, req.body);
//             if (updatedQuestion) {
//                 res.status(200).json(question);
//             } else {
//                 res.status(404).json({ 'message': 'Question not found for update.' });
//             }
//         } catch (error: any) {
//             console.error('Question update failed:', error.message || error);
//             res.status(400).json({ 'message': 'Question update failed: ' + error.message });
//         }
//     })
//     .delete(async (req: Request<{ id: string }>, res: Response) => {
//         const questionId = parseInt(req.params.id, 10);
//         if (isNaN(questionId)) {
//            // return res.status(400).json({ message: 'Invalid Question ID format.' });
//         }
//         try {
//             const questionService = getQuestionRepository(); // <--- Get the singleton instance from dependencies.ts
//             await questionService.deleteQuestion(questionId);
//             res.status(204).send();
//         } catch (error: any) {
//             console.error('Question deletion failed:', error.message || error);
//             res.status(500).json({ 'message': 'Question deletion failed: ' + error.message });
//         }
//     });

export default router;