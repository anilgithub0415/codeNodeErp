// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getAssignmentRepository } from '../../dependencies'; // <--- Get the service via getter
import { method1 } from '../Token/Token_dbOps';
import { codepageByLanguageId } from 'tedious/lib/collation';
import { CreateAssignmentDto, UpdateAssignmentDto } from '../../Models/Assignment.interfaces';


const router = Router();
router.route('')
    .post(async (req: Request<{}, {}, CreateAssignmentDto>, res: Response) => {
        try {
            const assignmentService = getAssignmentRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.tenantId ||!req.body.id ||!req.body.assignmentName
                  ) {
           
               console.log('Basic validation fail like tenantid, assignmentcode, assignmentname missing');
               
            }
  
       
            const assignment = await assignmentService.createAssignment(req.body);

            res.status(201).json(assignment);
        } catch (error: any) {
            console.error('Assignment creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Assignment creation failed: ' + error.message });
        }
    })

// --- PUT & DELETE: Endpoints targeting a specific assignment by ID ---
router.route('/:id')
    // --- PUT: Update a assignment by ID ---
    .put(async (req: Request<{ id: string }, {}, UpdateAssignmentDto>, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid assignment ID.' });
            }

            const assignmentService = getAssignmentRepository();
            const updatedAssignment = await assignmentService.updateAssignment(id, req.body);

            res.status(200).json(updatedAssignment);
        } catch (error: any) {
            console.error('Assignment update failed:', error.message || error);
            if (error.message === 'Assignment not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: 'Assignment update failed: ' + error.message });
        }
    })

    // --- DELETE: Delete a assignment by ID ---
    .delete(async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid assignment ID.' });
            }

            const assignmentService = getAssignmentRepository();
            await assignmentService.deleteAssignment(id);

            // A 204 No Content response is a standard way to indicate a successful DELETE request
            // with no response body.
            res.status(204).send();
        } catch (error: any) {
            console.error('Assignment deletion failed:', error.message || error);
            if (error.message === 'Assignment not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: 'Assignment deletion failed: ' + error.message });
        }
    });
    router.route('/')
    .get(async (req: Request, res: Response) => {
        console.log('....gtting assignments.........');
        
        try {
            
            const assignmentService = getAssignmentRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
         
        console.log(' and activetenantid is:',activeTenantId);
        
            const assignments = await assignmentService.getAssignments(activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(assignments);
        } catch (error: any) {
            console.error('Failed to retrieve assignments:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve assignments: " + error.message });
        }
    });
 
 
 router.route('/studentProfileId/:studentProfileId')
 .get(async (req: Request, res: Response) => {
     console.log('....gtting assignments.........for studentProfileId:',req.params.studentProfileId);
     var studentProfileId= parseInt(req.params.studentProfileId);
     try {
         
         const assignmentService = getAssignmentRepository(); // <--- Get the singleton instance from dependencies.ts
         var activeTenantId= req.query?.activeTenantId?.toString();
      
     console.log(' and activetenantid is:',activeTenantId);
     
         const assignments = await assignmentService.getAssignmentsForStudent(activeTenantId!,studentProfileId);//pass tenantId here as parameter
       
         res.status(200).json(assignments);
     } catch (error: any) {
         console.error('Failed to retrieve assignments:', error.message || error);
         res.status(500).json({ "message": "Failed to retrieve assignments: " + error.message });
     }
 });


 router.route('/facultyProfileId/:facultyProfileId')
 .get(async (req: Request, res: Response) => {
     console.log('....gtting assignments.........for facultyProfileId:',req.params.facultyProfileId);
     var facultyProfileId= parseInt(req.params.facultyProfileId);
     try {
         
         const assignmentService = getAssignmentRepository(); // <--- Get the singleton instance from dependencies.ts
         var activeTenantId= req.query?.activeTenantId?.toString();
      
     console.log(' and activetenantid is:',activeTenantId);
     
         const assignments = await assignmentService.getAssignmentsForFaculty(activeTenantId!,facultyProfileId);//pass tenantId here as parameter
       
         res.status(200).json(assignments);
     } catch (error: any) {
         console.error('Failed to retrieve assignments:', error.message || error);
         res.status(500).json({ "message": "Failed to retrieve assignments: " + error.message });
     }
 });

 
router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const assignmentService = getAssignmentRepository(); // <--- Get the singleton instance from dependencies.ts
            const assignmentId = parseInt(req.params.id, 10);
            if (isNaN(assignmentId)) {
            //    return res.status(400).json({ message: 'Invalid Assignment ID format.' });
            }
            
            const assignment = await assignmentService.getById(assignmentId);
            
            if (assignment) {            
               
                res.status(200).json(assignment);
            } else {
                res.status(404).json({ 'message': 'Assignment not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve assignment by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving assignment.' });
        }
    })

    

    .delete(async (req: Request<{ id: string }>, res: Response) => {
        const assignmentId = parseInt(req.params.id, 10);
        if (isNaN(assignmentId)) {
           // return res.status(400).json({ message: 'Invalid Assignment ID format.' });
        }
        try {
            const assignmentService = getAssignmentRepository(); // <--- Get the singleton instance from dependencies.ts
            await assignmentService.deleteAssignment(assignmentId);
            res.status(204).send();
        } catch (error: any) {
            console.error('Assignment deletion failed:', error.message || error);
            res.status(500).json({ 'message': 'Assignment deletion failed: ' + error.message });
        }
    });

export default router;