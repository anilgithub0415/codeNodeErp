// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getUserRepository } from '../../dependencies'; // <--- Get the service via getter

// Import types for request bodies and enums for type safety
//import { userRole } from '../../entity/User'; // Assuming UserRole is exported from User entity file
import { UserRoleLookup } from '../../entity/UserRoleLookup';
import { UpdateUserDTO } from '../../dto/CreateUser.dto';

// Define interfaces for request bodies
interface CreateUserRequestBody {
    firstName: string;  
    lastName: string;  
    contactEmail: string;  
    contactPhone:string;
    initialTenantId: string;  
    initialRoleName: string;//earlier UserRoleLookup;  
    deviceInfo : string;
    userName: string;
    password: string;
    displayName?: string;
    role: UserRoleLookup;//userRole;//changed
    tenantId: string; // Tenant ID is crucial for user creation now
    googleId?: string;
}

interface UpdateUserRequestBody {
    userName?: string;
    displayName?: string;
    password?: string;
    role?: any;//UserRoleLookup;//userRole;//changed enum to lookup
    isActive?: boolean;
    isEmailVerified?: boolean;
}

const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    // In a real app, you'd probably have an Auth middleware before this
    // to check if the user is an admin for accessing settings.
    try {
        const userService = getUserRepository(); // Attempt to get the service
        // You could attach it to res.locals or req for later use if desired,
        // but directly calling the getter in each route is also fine.
        next();
    } catch (error: any) {
        console.error('SettingsService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Settings service not ready.' });
    }
});  

//upload-profile-picture
router.post('/upload-profile-picture',async(req:Request,res:Response)=>{
    console.log('post method of upload-profile-picture is .............................................');
    
})

// router.route('')
//     .post(async (req: Request<{}, {}, CreateUserRequestBody>, res: Response) => {
//         try {
//             const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts

//             // Basic validation
//             if (!req.body.userName || !req.body.role || !req.body.tenantId) {
//                // return res.status(400).json({ message: 'User Name, Role, and Tenant ID are required for user creation.' });
//             }
//           //  if (req.body.role && !Object.values(userRole).includes(req.body.role)) {
//                //  return res.status(400).json({ message: `Invalid user role: ${req.body.Role}` });
//           // }

//             const user = await userService.CreateUser(req.body);

//             // Remove sensitive data (like password) before sending to client
//             const { password, ...userResponse } = user;
//             res.status(201).json(userResponse);
//         } catch (error: any) {
//             console.error('User creation failed:', error.message || error);
//             res.status(400).json({ 'message': 'User creation failed: ' + error.message });
//         }
//     })

router.route('')
    .post(async (req: Request<{}, {}, CreateUserRequestBody>, res: Response) => {
        try {
            const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.firstName ||!req.body.lastName ||!req.body.contactEmail ||!req.body.contactPhone
                  ) {
               // return res.status(400).json({ message: 'User Name, Role, and Tenant ID are required for user creation.' });
               console.log('Basic validation fail like firstName, lastName missing');
               
            }
          //  if (req.body.role && !Object.values(userRole).includes(req.body.role)) {
               //  return res.status(400).json({ message: `Invalid user role: ${req.body.Role}` });
          // }

          console.log('.........................................................usercontext body:',req.body);

          const { firstName, lastName, contactEmail, password, initialTenantId, initialRoleName, deviceInfo } = req.body;
            const user = await userService.createUserAndContext(req.body);

            // Remove sensitive data (like password) before sending to client
            //const { password, ...userResponse } = user;//pending-password must be skipped here
            //res.status(201).json(userResponse);
            res.status(201).json(user);
        } catch (error: any) {
            console.error('User creation failed:', error.message || error);
            res.status(400).json({ 'message': 'User creation failed: ' + error.message });
        }
    })

   
    router.route('/')
    .get(async (req: Request, res: Response) => {
        try {
            
        
            
            const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
            var roles=req.query?.roles?.toString().split(",");
           
            
        
            const users = await userService.getUsers(activeTenantId!,roles);
            // In a multi-tenant app, this should usually be filtered by the requesting user's tenantId.
            // Example: const users = await userService.getUsersByTenant(req.tenantId);
            //var users2=users.filter(usr=>roles?.includes(usr.role.rolename))
            res.status(200).json(users);
        } catch (error: any) {
            console.error('Failed to retrieve users:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve users: " + error.message });
        }
    });
    router.route('/roles')
    .get(async (req: Request, res: Response) => {
        try {
            // Assuming TenantService has a method to get types from TenantTypeLookupRepository
            const userService = getUserRepository();
            const roles = await userService.getUserRoles(); // This method needs to be implemented in TenantService
            res.status(200).json(roles.map(t => t.rolename)); // Send back just the string names
        } catch (error: any) {
            console.error('Failed to retrieve tenant types:', error.message || error);
            res.status(500).json({ message: 'Failed to retrieve tenant types.' });
        }
    });

    // get ussert table fields
    router.route('/user_table_fields')
    .get(async (req: Request, res: Response) => {
        try {
      
          var config_usersCreatedby=req.query.config_usersCreatedby?.toString();

            const userService = getUserRepository();
            const user_table_fields = await userService.get_user_table_fields(config_usersCreatedby);
            res.status(200).json(user_table_fields); 
        } catch (error: any) {
            console.error('Failed to retrieveuser_table_fields:', error.message || error);
            res.status(500).json({ message: 'Failed to retrieve user_table_fields.' });
        }
    });
    router.route('/:id/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
              console.log('........is this caled?.........');
              
        try {
            var tenantid='notexistingtenant'
            const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts
            const users = await userService.getUsers(tenantid);
            // In a multi-tenant app, this should usually be filtered by the requesting user's tenantId.
            // Example: const users = await userService.getUsersByTenant(req.tenantId);
            res.status(200).json(users);
        } catch (error: any) {
            console.error('Failed to retrieve users:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve users: " + error.message });
        }
    });
    // //only students    
    // router.route('/:id/ptenantId/:ptenantId/:paramcondition')
    // .get(async (req: Request, res: Response) => {
    //     try {
    //         console.log('req.params.paramcondition:',req.params.paramcondition);
    //         var pramcondition=req.params.paramcondition;

    //         const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts
    //         const users = await userService.getUsers(pramcondition);//req.params.ptenantId,
    //         // In a multi-tenant app, this should usually be filtered by the requesting user's tenantId.
    //         // Example: const users = await userService.getUsersByTenant(req.tenantId);
    //         res.status(200).json(users);
    //     } catch (error: any) {
    //         console.error('Failed to retrieve users:', error.message || error);
    //         res.status(500).json({ "message": "Failed to retrieve users: " + error.message });
    //     }
    // });
    
router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts
            const userId = parseInt(req.params.id, 10);
            if (isNaN(userId)) {
            //    return res.status(400).json({ message: 'Invalid User ID format.' });
            }
            
            const user = await userService.getById(userId);
            
            if (user) {
              
                const { password, ...userResponse } = user;
                res.status(200).json(userResponse);
            } else {
                res.status(404).json({ 'message': 'User not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve user by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving user.' });
        }
    })
    .put(async (req: Request<{ id: string }, {}, UpdateUserDTO>, res: Response) => { //UpdateUserRequestBody
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
          //  return res.status(400).json({ message: 'Invalid User ID format.' });
        }
        try {
                   
            const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts
            const updatedUser = await userService.updateUser(userId, req.body);
            if (updatedUser) {
                const { password, ...userResponse } = updatedUser;
                res.status(200).json(userResponse);
            } else {
                res.status(404).json({ 'message': 'User not found for update.' });
            }
        } catch (error: any) {
            console.error('User update failed:', error.message || error);
            res.status(400).json({ 'message': 'User update failed: ' + error.message });
        }
    })
    .delete(async (req: Request<{ id: string }>, res: Response) => {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
           // return res.status(400).json({ message: 'Invalid User ID format.' });
        }
        try {
            const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts
            await userService.deleteUser(userId);
            res.status(204).send();
        } catch (error: any) {
            console.error('User deletion failed:', error.message || error);
            res.status(500).json({ 'message': 'User deletion failed: ' + error.message });
        }
    });

export default router;