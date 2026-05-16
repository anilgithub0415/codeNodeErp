// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getCourseOfferingRepository } from '../../dependencies'; // <--- Get the service via getter
import { CreateCourseOfferingDto, UpdateCourseOfferingDto } from '../../Models/CourseOffering.interfaces';
  
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
    .post(async (req: Request<{}, {}, CreateCourseOfferingDto>, res: Response) => {
        try {
            const courseOfferingService = getCourseOfferingRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.tenantId ||!req.body.offeringName ||!req.body.schedule
                  ) {
           
               console.log('Basic validation fail like tenantid, courseOfferingcode, courseOfferingname missing');
               
            }
  
       
            const courseOffering = await courseOfferingService.createCourseOffering(req.body);

            res.status(201).json(courseOffering);
        } catch (error: any) {
            console.error('CourseOffering creation failed:', error.message || error);
            res.status(400).json({ 'message': 'CourseOffering creation failed: ' + error.message });
        }
    })

http://localhost:3000/api/
// --- PUT & DELETE: Endpoints targeting a specific courseOffering by ID ---
router.route('/:id')
// --- PUT: Update a courseOffering by ID ---
.put(async (req: Request<{ id: string }, {}, UpdateCourseOfferingDto>, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid courseOffering ID.' });
        }

        const courseOfferingService = getCourseOfferingRepository();
        const updatedCourseOffering = await courseOfferingService.updateCourseOffering(id, req.body);

        res.status(200).json(updatedCourseOffering);
    } catch (error: any) {
        console.error('CourseOffering update failed:', error.message || error);
        if (error.message === 'CourseOffering not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: 'CourseOffering update failed: ' + error.message });
    }
})


    router.route('/')
    .get(async (req: Request, res: Response) => {
        try {
            
            const courseOfferingService = getCourseOfferingRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
         
        
            const courses = await courseOfferingService.getCourseOfferings(activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(courses);
        } catch (error: any) {
            console.error('Failed to retrieve courses:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve courses: " + error.message });
        }
    });
 
    
    router.route('/courseid/:id')
    .get(async (req: Request, res: Response) => {
        try {
            
            var pcourseid=parseInt(req.params.id);
            const courseOfferingService = getCourseOfferingRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
         
        
            const courses = await courseOfferingService.getCourseOfferingsByCourseId(pcourseid,activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(courses);
        } catch (error: any) {
            console.error('Failed to retrieve courses:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve courses: " + error.message });
        }
    });
 
router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const courseOfferingService = getCourseOfferingRepository(); // <--- Get the singleton instance from dependencies.ts
            const courseId = parseInt(req.params.id, 10);
            if (isNaN(courseId)) {
            //    return res.status(400).json({ message: 'Invalid CourseOffering ID format.' });
            }
            
            const course = await courseOfferingService.getById(courseId);
            
            if (course) {            
               
                res.status(200).json(course);
            } else {
                res.status(404).json({ 'message': 'CourseOffering not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve course by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving course.' });
        }
    })

    

//     .put(async (req: Request<{ id: string }, {}, UpdateCourseOfferingDTO>, res: Response) => { //UpdateCourseOfferingRequestBody
//         const courseId = parseInt(req.params.id, 10);
//         if (isNaN(courseId)) {
//           //  return res.status(400).json({ message: 'Invalid CourseOffering ID format.' });
//         }
//         try {
                   
//             const courseService = getCourseOfferingRepository(); // <--- Get the singleton instance from dependencies.ts
//             const updatedCourseOffering = await courseService.updateCourseOffering(courseId, req.body);
//             if (updatedCourseOffering) {
//                 res.status(200).json(course);
//             } else {
//                 res.status(404).json({ 'message': 'CourseOffering not found for update.' });
//             }
//         } catch (error: any) {
//             console.error('CourseOffering update failed:', error.message || error);
//             res.status(400).json({ 'message': 'CourseOffering update failed: ' + error.message });
//         }
//     })
    .delete(async (req: Request<{ id: string }>, res: Response) => {
        const courseId = parseInt(req.params.id, 10);
        if (isNaN(courseId)) {
           // return res.status(400).json({ message: 'Invalid CourseOffering ID format.' });
        }
        try {
            const courseOfferingService = getCourseOfferingRepository(); // <--- Get the singleton instance from dependencies.ts
            await courseOfferingService.deleteCourseOffering(courseId);
            res.status(204).send();
        } catch (error: any) {
            console.error('CourseOffering deletion failed:', error.message || error);
            res.status(500).json({ 'message': 'CourseOffering deletion failed: ' + error.message });
        }
    });

export default router;