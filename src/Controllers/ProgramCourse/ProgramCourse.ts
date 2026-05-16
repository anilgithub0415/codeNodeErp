// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getProgramCourseRepository } from '../../dependencies'; // <--- Get the service via getter
import { CreateProgramCourseRequestDto,UpdateProgramCourseRequestDto } from '../../Models/ProgramCourse.interfaces';


const router = Router();

    
router.route('')
.post(async (req: Request<{}, {}, CreateProgramCourseRequestDto>, res: Response) => {
    try {

        console.log('req body for programcourse adding:',req.body);
        
        const programCourseService = getProgramCourseRepository(); // <--- Get the singleton instance from dependencies.ts

        // Basic validation
        if (!req.body.tenantId ||!req.body.programId ||!req.body.courseId
              ) {
       
           console.log('Basic validation fail like tenantid, programId, courseId missing');
           
        }

   
        const programCourse = await programCourseService.createProgramCourse(req.body);

        res.status(201).json(programCourse);
    } catch (error: any) {
        console.error('ProgramCourse creation failed:', error.message || error);
        res.status(400).json({ 'message': 'ProgramCourse creation failed: ' + error.message });
    }
})

// --- PUT & DELETE: Endpoints targeting a specific programCourse by ID ---
router.route('/:id')
// --- PUT: Update a programCourse by ID ---
.put(async (req: Request<{ id: string }, {}, UpdateProgramCourseRequestDto>, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid programCourse ID.' });
        }

        const programCourseService = getProgramCourseRepository();
        const updatedProgramCourse = await programCourseService.updateProgramCourse(id, req.body);

        res.status(200).json(updatedProgramCourse);
    } catch (error: any) {
        console.error('ProgramCourse update failed:', error.message || error);
        if (error.message === 'ProgramCourse not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: 'ProgramCourse update failed: ' + error.message });
    }
})

// --- DELETE: Delete a programCourse by ID ---
.delete(async (req: Request<{ id: string }>, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid programCourse ID.' });
        }

        const programCourseService = getProgramCourseRepository();
        await programCourseService.deleteProgramCourse(id);

        // A 204 No Content response is a standard way to indicate a successful DELETE request
        // with no response body.
        res.status(204).send();
    } catch (error: any) {
        console.error('ProgramCourse deletion failed:', error.message || error);
        if (error.message === 'ProgramCourse not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: 'ProgramCourse deletion failed: ' + error.message });
    }
});

    router.route('/')
    .get(async (req: Request, res: Response) => {
        try {
            
            const programCourseService = getProgramCourseRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const programCourses = await programCourseService.getProgramCourses(activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(programCourses);
        } catch (error: any) {
            console.error('Failed to retrieve programCourses:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve programCourses: " + error.message });
        }
    });
 
    
router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const programCourseService = getProgramCourseRepository(); // <--- Get the singleton instance from dependencies.ts
            const programCourseId = parseInt(req.params.id, 10);
            if (isNaN(programCourseId)) {
            //    return res.status(400).json({ message: 'Invalid ProgramCourse ID format.' });
            }
            
            const programCourse = await programCourseService.getById(programCourseId);
            
            if (programCourse) {            
               
                res.status(200).json(programCourse);
            } else {
                res.status(404).json({ 'message': 'ProgramCourse not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve programCourse by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving programCourse.' });
        }
    })


export default router;