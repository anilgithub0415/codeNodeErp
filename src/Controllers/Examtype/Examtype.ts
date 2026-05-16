// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getExamTypeRepository } from '../../dependencies'; // <--- Get the service via getter

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

// router.route('')
//     .post(async (req: Request<{}, {}, CreateUserRequestBody>, res: Response) => {
//         try {
//             const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts

//             // Basic validation
//             if (!req.body.firstName ||!req.body.lastName ||!req.body.contactEmail ||!req.body.contactPhone
//                   ) {
//                // return res.status(400).json({ message: 'User Name, Role, and Tenant ID are required for user creation.' });
//                console.log('Basic validation fail like firstName, lastName missing');
               
//             }
//           //  if (req.body.role && !Object.values(userRole).includes(req.body.role)) {
//                //  return res.status(400).json({ message: `Invalid user role: ${req.body.Role}` });
//           // }

//           console.log('.........................................................usercontext body:',req.body);

//           const { firstName, lastName, contactEmail, password, initialTenantId, initialRoleName, deviceInfo } = req.body;
//             const user = await userService.createUserAndContext(req.body);

//             // Remove sensitive data (like password) before sending to client
//             //const { password, ...userResponse } = user;//pending-password must be skipped here
//             //res.status(201).json(userResponse);
//             res.status(201).json(user);
//         } catch (error: any) {
//             console.error('User creation failed:', error.message || error);
//             res.status(400).json({ 'message': 'User creation failed: ' + error.message });
//         }
//     })

    
    router.route('/')
    .get(async (req: Request, res: Response) => {
        try {
            
            const examtypeService = getExamTypeRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
         
        
            const examtypes = await examtypeService.getExamTypes();//pass tenantId here as parameter
          
            res.status(200).json(examtypes);
        } catch (error: any) {
            console.error('Failed to retrieve examtypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve examtypes: " + error.message });
        }
    });
 
    
router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const examtypeService = getExamTypeRepository(); // <--- Get the singleton instance from dependencies.ts
            const examtypeId = parseInt(req.params.id, 10);
            if (isNaN(examtypeId)) {
            //    return res.status(400).json({ message: 'Invalid ExamType ID format.' });
            }
            
            const examtype = await examtypeService.getById(examtypeId);
            
            if (examtype) {            
               
                res.status(200).json(examtype);
            } else {
                res.status(404).json({ 'message': 'ExamType not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve examtype by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving examtype.' });
        }
    })
//     .put(async (req: Request<{ id: string }, {}, UpdateExamTypeDTO>, res: Response) => { //UpdateExamTypeRequestBody
//         const examtypeId = parseInt(req.params.id, 10);
//         if (isNaN(examtypeId)) {
//           //  return res.status(400).json({ message: 'Invalid ExamType ID format.' });
//         }
//         try {
                   
//             const examtypeService = getExamTypeRepository(); // <--- Get the singleton instance from dependencies.ts
//             const updatedExamType = await examtypeService.updateExamType(examtypeId, req.body);
//             if (updatedExamType) {
//                 res.status(200).json(examtype);
//             } else {
//                 res.status(404).json({ 'message': 'ExamType not found for update.' });
//             }
//         } catch (error: any) {
//             console.error('ExamType update failed:', error.message || error);
//             res.status(400).json({ 'message': 'ExamType update failed: ' + error.message });
//         }
//     })
//     .delete(async (req: Request<{ id: string }>, res: Response) => {
//         const examtypeId = parseInt(req.params.id, 10);
//         if (isNaN(examtypeId)) {
//            // return res.status(400).json({ message: 'Invalid ExamType ID format.' });
//         }
//         try {
//             const examtypeService = getExamTypeRepository(); // <--- Get the singleton instance from dependencies.ts
//             await examtypeService.deleteExamType(examtypeId);
//             res.status(204).send();
//         } catch (error: any) {
//             console.error('ExamType deletion failed:', error.message || error);
//             res.status(500).json({ 'message': 'ExamType deletion failed: ' + error.message });
//         }
//     });

export default router;