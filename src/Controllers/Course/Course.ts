// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getCourseRepository } from '../../dependencies'; // <--- Get the service via getter
import { method1 } from '../Token/Token_dbOps';
import { codepageByLanguageId } from 'tedious/lib/collation';
import { CreateCourseDto, UpdateCourseDto } from '../../Models/Course.interfaces';


const router = Router();
router.route('')
    .post(async (req: Request<{}, {}, CreateCourseDto>, res: Response) => {
        try {
            const courseService = getCourseRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.tenantId ||!req.body.courseCode ||!req.body.courseName
                  ) {
           
               console.log('Basic validation fail like tenantid, coursecode, coursename missing');
               
            }
  
       
            const course = await courseService.createCourse(req.body);

            res.status(201).json(course);
        } catch (error: any) {
            console.error('Course creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Course creation failed: ' + error.message });
        }
    })

// --- PUT & DELETE: Endpoints targeting a specific course by ID ---
router.route('/:id')
    // --- PUT: Update a course by ID ---
    .put(async (req: Request<{ id: string }, {}, UpdateCourseDto>, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid course ID.' });
            }

            const courseService = getCourseRepository();
            const updatedCourse = await courseService.updateCourse(id, req.body);

            res.status(200).json(updatedCourse);
        } catch (error: any) {
            console.error('Course update failed:', error.message || error);
            if (error.message === 'Course not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: 'Course update failed: ' + error.message });
        }
    })

    // --- DELETE: Delete a course by ID ---
    .delete(async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid course ID.' });
            }

            const courseService = getCourseRepository();
            await courseService.deleteCourse(id);

            // A 204 No Content response is a standard way to indicate a successful DELETE request
            // with no response body.
            res.status(204).send();
        } catch (error: any) {
            console.error('Course deletion failed:', error.message || error);
            if (error.message === 'Course not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: 'Course deletion failed: ' + error.message });
        }
    });
    router.route('/')
    .get(async (req: Request, res: Response) => {
        console.log('....gtting courses.........');
        
        try {
            
            const courseService = getCourseRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
         
        console.log(' and activetenantid is:',activeTenantId);
        
            const courses = await courseService.getCourses(activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(courses);
        } catch (error: any) {
            console.error('Failed to retrieve courses:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve courses: " + error.message });
        }
    });
 

    
    router.route('/programId/:id')
    .get(async (req: Request, res: Response) => {
        console.log('....gtting courses by programId.........');
        var programId=parseInt(req.params.id);
        try {
            
            const courseService = getCourseRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
         
        console.log(' and activetenantid is:',activeTenantId);
        
            const courses = await courseService.getCoursesByProgramId(programId,activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(courses);
        } catch (error: any) {
            console.error('Failed to retrieve courses:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve courses: " + error.message });
        }
    });

router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const courseService = getCourseRepository(); // <--- Get the singleton instance from dependencies.ts
            const courseId = parseInt(req.params.id, 10);
            if (isNaN(courseId)) {
            //    return res.status(400).json({ message: 'Invalid Course ID format.' });
            }
            
            const course = await courseService.getById(courseId);
            
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

    

//     .put(async (req: Request<{ id: string }, {}, UpdateCourseDTO>, res: Response) => { //UpdateCourseRequestBody
//         const courseId = parseInt(req.params.id, 10);
//         if (isNaN(courseId)) {
//           //  return res.status(400).json({ message: 'Invalid Course ID format.' });
//         }
//         try {
                   
//             const courseService = getCourseRepository(); // <--- Get the singleton instance from dependencies.ts
//             const updatedCourse = await courseService.updateCourse(courseId, req.body);
//             if (updatedCourse) {
//                 res.status(200).json(course);
//             } else {
//                 res.status(404).json({ 'message': 'Course not found for update.' });
//             }
//         } catch (error: any) {
//             console.error('Course update failed:', error.message || error);
//             res.status(400).json({ 'message': 'Course update failed: ' + error.message });
//         }
//     })
    .delete(async (req: Request<{ id: string }>, res: Response) => {
        const courseId = parseInt(req.params.id, 10);
        if (isNaN(courseId)) {
           // return res.status(400).json({ message: 'Invalid Course ID format.' });
        }
        try {
            const courseService = getCourseRepository(); // <--- Get the singleton instance from dependencies.ts
            await courseService.deleteCourse(courseId);
            res.status(204).send();
        } catch (error: any) {
            console.error('Course deletion failed:', error.message || error);
            res.status(500).json({ 'message': 'Course deletion failed: ' + error.message });
        }
    });

export default router;