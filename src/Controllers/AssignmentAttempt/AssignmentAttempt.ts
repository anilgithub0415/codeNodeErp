// src/Controllers/User/User_1.ts  
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getAssignmentAttemptRepository, getAssignmentRepository } from '../../dependencies'; // <--- Get the service via getter
import { method1 } from '../Token/Token_dbOps';
import { codepageByLanguageId } from 'tedious/lib/collation';
import { CreateAssignmentAttemptDto, UpdateAssignmentAttemptDto } from '../../Models/AssignmentAttempt.interfaces';


const router = Router();
router.route('')
    .post(async (req: Request<{}, {}, CreateAssignmentAttemptDto>, res: Response) => {

        console.log('assignmentattempt post hit........................................req.body',req.body);
        

        try {
            const assignmentAttemptService = getAssignmentAttemptRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.tenantId ||!req.body.studentProfileId ||!req.body.submissionDate
                  ) {
           
               console.log('Basic validation fail like tenantid, studentProfileId, submissionDate missing');
               
            }
  
       
            const assignmentAttempt = await assignmentAttemptService.createAssignmentAttempt(req.body);

            res.status(201).json(assignmentAttempt);
        } catch (error: any) {
            console.error('Assignment creation failed:', error.message || error);
            res.status(400).json({ 'message': 'AssignmentAttempt creation failed: ' + error.message });
        }
    })

// --- PUT & DELETE: Endpoints targeting a specific assignmentAttempt by ID ---
router.route('/:id')
    // --- PUT: Update a assignmentAttempt by ID ---
    .put(async (req: Request<{ id: string }, {}, UpdateAssignmentAttemptDto>, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid assignmentAttempt ID.' });
            }

            const assignmentAttemptService = getAssignmentAttemptRepository();
            const updatedAssignmentAttempt = await assignmentAttemptService.updateAssignmentAttempt(id, req.body);

            res.status(200).json(updatedAssignmentAttempt);
        } catch (error: any) {
            console.error('AssignmentAttempt update failed:', error.message || error);
            if (error.message === 'AssignmentAttempt not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: 'AssignmentAttempt update failed: ' + error.message });
        }
    })

    //getdetails by attemptid
    router.route('/:id')
    // --- PUT: Update a assignmentAttempt by ID ---
    .get(async (req: Request<{ id: string }, {}, UpdateAssignmentAttemptDto>, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid assignmentAttempt ID.' });
            }

            const assignmentAttemptService = getAssignmentAttemptRepository();
            const attemptId = parseInt(req.params.id, 10);
            if (isNaN(attemptId)) {
            //    return res.status(400).json({ message: 'Invalid Course ID format.' });
            }
            
            const course = await assignmentAttemptService.getById(attemptId);
            
            if (course) {            
               
                res.status(200).json(course);
            } else {
                res.status(404).json({ 'message': 'Course not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve course by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving course.' });
        }
    })



//     // --- DELETE: Delete a assignmentAttempt by ID ---
//     .delete(async (req: Request<{ id: string }>, res: Response) => {
//         try {
//             const id = parseInt(req.params.id, 10);
//             if (isNaN(id)) {
//                 return res.status(400).json({ message: 'Invalid assignmentAttempt ID.' });
//             }

//             const assignmentAttemptService = getAssignmentAttemptRepository();
//             await assignmentAttemptService.deleteAssignmentAttempt(id);

//             // A 204 No Content response is a standard way to indicate a successful DELETE request
//             // with no response body.
//             res.status(204).send();
//         } catch (error: any) {
//             console.error('AssignmentAttempt deletion failed:', error.message || error);
//             if (error.message === 'AssignmentAttempt not found') {
//                 return res.status(404).json({ message: error.message });
//             }
//             res.status(400).json({ message: 'AssignmentAttempt deletion failed: ' + error.message });
//         }
//     });
//     router.route('/')
//     .get(async (req: Request, res: Response) => {
//         console.log('....gtting assignmentAttempts.........');
        
//         try {
            
//             const assignmentAttemptService = getAssignmentAttemptRepository(); // <--- Get the singleton instance from dependencies.ts
//             var activeTenantId=req.query?.activeTenantId?.toString();
         
//         console.log(' and activetenantid is:',activeTenantId);
        
//             const assignmentAttempts = await assignmentAttemptService.getAssignmentAttempts(activeTenantId!);//pass tenantId here as parameter
          
//             res.status(200).json(assignmentAttempts);
//         } catch (error: any) {
//             console.error('Failed to retrieve assignmentAttempts:', error.message || error);
//             res.status(500).json({ "message": "Failed to retrieve assignmentAttempts: " + error.message });
//         }
//     });
 
    router.route('/reviewresult/:id')
    .get(async (req: Request, res: Response) => {
        console.log('....gtting reviewresult of assignmentAttemptId.........');
        
        var assignmentAttemptId=parseInt(req.params.id);

        try {
            
            const assignmentAttemptService = getAssignmentAttemptRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
        
            const assignmentAttempts = await assignmentAttemptService.getReviewResultOfAssignmentAttempt(assignmentAttemptId,activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(assignmentAttempts);
        } catch (error: any) {
            console.error('Failed to retrieve assignmentAttempts:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve assignmentAttempts: " + error.message });
        }

    });

// router.route('/:id')
//     .get(async (req: Request<{ id: string }>, res: Response) => {
//         try {
           
//             const assignmentAttemptService = getAssignmentAttemptRepository(); // <--- Get the singleton instance from dependencies.ts
//             const assignmentAttemptId = parseInt(req.params.id, 10);
//             if (isNaN(assignmentAttemptId)) {
//             //    return res.status(400).json({ message: 'Invalid AssignmentAttempt ID format.' });
//             }
            
//             const assignmentAttempt = await assignmentAttemptService.getById(assignmentAttemptId);
            
//             if (assignmentAttempt) {            
               
//                 res.status(200).json(assignmentAttempt);
//             } else {
//                 res.status(404).json({ 'message': 'AssignmentAttempt not found.' });
//             }
//         } catch (error: any) {
//             console.error('Failed to retrieve assignmentAttempt by ID:', error.message || error);
//             res.status(500).json({ 'message': 'Error retrieving assignmentAttempt.' });
//         }
//     })

    

//     .delete(async (req: Request<{ id: string }>, res: Response) => {
//         const assignmentAttemptId = parseInt(req.params.id, 10);
//         if (isNaN(assignmentAttemptId)) {
//            // return res.status(400).json({ message: 'Invalid AssignmentAttempt ID format.' });
//         }
//         try {
//             const assignmentAttemptService = getAssignmentAttemptRepository(); // <--- Get the singleton instance from dependencies.ts
//             await assignmentAttemptService.deleteAssignmentAttempt(assignmentAttemptId);
//             res.status(204).send();
//         } catch (error: any) {
//             console.error('AssignmentAttempt deletion failed:', error.message || error);
//             res.status(500).json({ 'message': 'AssignmentAttempt deletion failed: ' + error.message });
//         }
//     });

export default router;