// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getSubjectRepository } from '../../dependencies'; // <--- Get the service via getter
import { CreateSubjectDto, UpdateSubjectDto } from '../../Models/Subject.interfaces';


const router = Router();   


router.route('')
    .post(async (req: Request<{}, {}, CreateSubjectDto>, res: Response) => {
        try {
            const subjectService = getSubjectRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.tenantId ||!req.body.subjectCode ||!req.body.subjectName
                  ) {
           
               console.log('Basic validation fail like tenantid, subjectcode, subjectname missing');
               
            }
  
       
            const subject = await subjectService.createSubject(req.body);

            res.status(201).json(subject);
        } catch (error: any) {
            console.error('Subject creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Subject creation failed: ' + error.message });
        }
    })

    
// --- PUT & DELETE: Endpoints targeting a specific subject by ID ---
router.route('/:id')
// --- PUT: Update a subject by ID ---
.put(async (req: Request<{ id: string }, {}, UpdateSubjectDto>, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid subject ID.' });
        }

        const subjectService = getSubjectRepository();
        const updatedSubject = await subjectService.updateSubject(id, req.body);

        res.status(200).json(updatedSubject);
    } catch (error: any) {
        console.error('Subject update failed:', error.message || error);
        if (error.message === 'Subject not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: 'Subject update failed: ' + error.message });
    }
})

    // --- DELETE: Delete a subject by ID ---
    
router.route('/:id')
    .delete(async (req: Request<{ id: string }>, res: Response) => {
        console.log('....this is subject controller delete method');
        
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid subject ID.' });
            }

            const subjectService = getSubjectRepository();
            await subjectService.deleteSubject(id);

            // A 204 No Content response is a standard way to indicate a successful DELETE request
            // with no response body.
            res.status(204).send();
        } catch (error: any) {
            console.error('Subject deletion failed:', error.message || error);
            if (error.message === 'Subject not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: 'Subject deletion failed: ' + error.message });
        }
    });

    router.route('/')
    .get(async (req: Request, res: Response) => {
        try {
            console.log('m Subject controller............and ,,,');
//console.log('req.user.id:',req.user.id);
            
            const subjectService = getSubjectRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
         
        
            const subjects = await subjectService.getSubjects(activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(subjects);
        } catch (error: any) {
            console.error('Failed to retrieve subjects:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve subjects: " + error.message });
        }
    });
 
router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const subjectService = getSubjectRepository(); // <--- Get the singleton instance from dependencies.ts
            const subjectId = parseInt(req.params.id, 10);
            if (isNaN(subjectId)) {
            //    return res.status(400).json({ message: 'Invalid Subject ID format.' });
            }
            
            const subject = await subjectService.getById(subjectId);
            
            if (subject) {            
               
                res.status(200).json(subject);
            } else {
                res.status(404).json({ 'message': 'Subject not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve subject by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving subject.' });
        }
    })

    

export default router;