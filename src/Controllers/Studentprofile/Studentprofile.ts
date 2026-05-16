// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getStudentProfileRepository } from '../../dependencies'; // <--- Get the service via getter
import { StudentProfile } from '../../entity/StudentProfile';


// // Define interfaces for request bodies
interface CreateStudentProfileRequestBody {
 
    tenantId: string;
    personId:number;
    studentIdNumber?:number;
    enrollmentStatus?:string;
    enrollmentDate:Date;
    createdByUserId:number;
}

// interface UpdateStudentProfileRequestBody {
//     firstName?:string;
//     lastName?:string;
//     contactEmail?:string;
//     contactPhone?:string;
//     dateOfBirth?:Date;
//     gender?:string;
//     addressLine1?:string;
//     addressLine2?:string;
//     city?:string;
//     state?:string;
//     zipCode?:string;
//     country?:string;
// }

const router = Router();

router.use((req, res, next) => {   
    try {
        const studentProfileService = getStudentProfileRepository(); // Attempt to get the service
        // You could attach it to res.locals or req for later use if desired,
        // but directly calling the getter in each route is also fine.
        next();
    } catch (error: any) {
        console.error('studentProfileService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. StudentProfile service not ready.' });
    }
});  


router.route('')
    .post(async (req: Request<{}, {}, Partial<StudentProfile>>, res: Response) => {
        try {
            console.log('hitting post of stud profile...................');
            
            const studentProfileService = getStudentProfileRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.tenantId || !req.body.personId  || !req.body.enrollmentDate  || !req.body.enrollmentStatus ) {
               // return res.status(400).json({ message: 'User Name, Role, and Tenant ID are required for user creation.' });
            }
          //  if (req.body.role && !Object.values(userRole).includes(req.body.role)) {
               //  return res.status(400).json({ message: `Invalid user role: ${req.body.Role}` });
          // }

            const studentProfile = await studentProfileService.createStudentProfileWithAutoId(req.body);

            
            res.status(201).json(studentProfile);
        } catch (error: any) {
            console.error('User creation failed:', error.message || error);
            res.status(400).json({ 'message': 'User creation failed: ' + error.message });
        }
    })

//pending- student profile must be retreived using tenantid as there may be multiple profiles with different tenantids
router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const studentProfileService = getStudentProfileRepository(); // <--- Get the singleton instance from dependencies.ts
            const studentProfileId = parseInt(req.params.id, 10);
            if (isNaN(studentProfileId)) {
            //    return res.status(400).json({ message: 'Invalid User ID format.' });
            }
            var byIdOrPersonId=req.query.byIdOrPersonId?.toString();
            var activeTenantId=req.query?.activeTenantId?.toString();

            //const studentProfile = await studentProfileService.byIdOrPersonId(studentProfileId,byIdOrPersonId!,activeTenantId!);
            var studentProfile;
            if(byIdOrPersonId==='byPersonId'){
             studentProfile = await studentProfileService.getStudentProfileByPersonId(studentProfileId,activeTenantId!);
            }else if (byIdOrPersonId==='byId'){                
                studentProfile = await studentProfileService.getStudentProfileById(studentProfileId,activeTenantId!);
            }
            
            if (studentProfile) {                       
                res.status(200).json(studentProfile);
            } else {
                    console.log('res.status returning 404');
                             
                res.status(404).json({ 'message': 'Student Profile not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve user by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving student profile.' });
        }
    })


router.route('/')
.get(async (req: Request, res: Response) => {
    console.log('...................yes StudentProfile list getting called...........');
    
    try {
        
        const studentProfileService = getStudentProfileRepository(); // <--- Get the singleton instance from dependencies.ts
    
        const studentProfiles = await studentProfileService.getStudentProfiles();
        
        // In a multi-tenant app, this should usually be filtered by the requesting user's tenantId.
        // Example: const studentProfiles = await studentProfileService.getUsersByTenant(req.tenantId);
       // var studentProfiles2=studentProfiles.filter(usr=>roles?.includes(usr.role.rolename))
        res.status(200).json(studentProfiles);
    } catch (error: any) {
        console.error('Failed to retrieve studentProfiles:', error.message || error);
        res.status(500).json({ "message": "Failed to retrieve studentProfiles: " + error.message });
    }
});

    // router.route('/:id')
    // .put(async (req: Request<{ id: string }, {}, UpdateStudentProfileDTO>, res: Response) => { //UpdateUserRequestBody
    //     const  studentProfileId = parseInt(req.params.id, 10);
    //     if (isNaN(studentProfileId)) {
    //       //  return res.status(400).json({ message: 'Invalid User ID format.' });
    //     }
    //     try {
                   
    //         const studentProfileService = getStudentProfileRepository(); // <--- Get the singleton instance from dependencies.ts
    //         const updatedStudentProfile = await studentProfileService.updateStudentProfile(studentProfileId, req.body);
    //         if (updatedStudentProfile) {
    //                     res.status(200).json(updatedStudentProfile);
    //         } else {
    //             res.status(404).json({ 'message': 'StudentProfile not found for update.' });
    //         }
    //     } catch (error: any) {
    //         console.error('StudentProfile update failed:', error.message || error);
    //         res.status(400).json({ 'message': 'StudentProfile update failed: ' + error.message });
    //     }
    // })

export default router;