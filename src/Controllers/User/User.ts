/*Pending 14Jul2026
Need to crosscheck , how these 3 entities:User, UserTenantContext, and UserRolelookUp 
are related by FK constraint 
*/
// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
import { getUser_tableServiceRepository, getUserRepository } from '../../dependencies'; 
import { UserRoleLookup } from '../../entity/UserRoleLookup';

interface CreateUserRequestBody {
    firstName: string;  
    lastName: string;  
    contactEmail: string;  
    contactPhone: string;
    initialTenantId: number;  
    assignedRoles: string[]; // 👈 Changed from initialRoleName to an array payload packet
    deviceInfo: string;
    userName: string;
    password: string;
    displayName?: string;
    clientId?: number | null; 
    siteId?: number | null;   
    role: UserRoleLookup;
    tenantId: number; 
    googleId?: string;
    userAbbrevation?: string; 
}

const router = Router();

router.use((req, res, next) => {
    try {
        getUserRepository(); 
        next();
    } catch (error: any) {
        console.error('UserService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. User service not ready.' });
    }
});  

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

router.post('/upload-profile-picture', async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Profile picture upload context matched.' });
});

router.route('/roles')
    .get(async (req: Request, res: Response) => {
        try {
            const activeTenantId = parseInt(req.query?.activeTenantId?.toString()!, 10);
            const userService = getUserRepository();
            const roles = await userService.getUserRoles(activeTenantId); 
            res.status(200).json(roles.map(t => t.rolename)); 
        } catch (error: any) {
            console.error('Failed to retrieve tenant types:', error.message || error);
            res.status(500).json({ message: 'Failed to retrieve tenant types.' });
        }
    });

router.route('/user_table_fields')
    .get(async (req: Request, res: Response) => {
        try {
            const config_usersCreatedby = req.query.config_usersCreatedby?.toString();
            const usertableService = getUser_tableServiceRepository();
            const user_table_fields = await usertableService.get_user_table_fields(config_usersCreatedby);
            res.status(200).json(user_table_fields); 
        } catch (error: any) {
            console.error('Failed to retrieve user_table_fields:', error.message || error);
            res.status(500).json({ message: 'Failed to retrieve user_table_fields.' });
        }
    });

// ==========================================
// CRUD OPERATIONS
// ==========================================

router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            const tenantId = parseInt(req.params.tenantId, 10);        
            const pId = parseInt(req.params.id, 10);
            const userService = getUserRepository(); 
            const aUser = await userService.getUser(tenantId, pId);
            res.status(200).json(aUser);
        } catch (error: any) {
            console.error('Failed to retrieve a user:', error.message || error);
            res.status(500).json({ message: "Failed to retrieve a user: " + error.message });
        }
    });

router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            const userService = getUserRepository(); 
            const tenantId = parseInt(req.params.tenantId, 10);
            const users = await userService.getUsersSimple(tenantId);
            res.status(200).json(users);
        } catch (error: any) {
            console.error('Failed to retrieve users:', error.message || error);
            res.status(500).json({ message: "Failed to retrieve users: " + error.message });
        }
    });

router.route('').post(async (req: Request<{}, {}, CreateUserRequestBody>, res: Response) => {

    try {
        const userService = getUserRepository();

        if (!req.body.userName) {
            return res.status(400).json({ message: 'User Name is a mandatory field.' });
        }

        const secureUserPayload = {
            ...req.body,
            tenantId: (req as any).user.tenantId,        
            createdByUserId: (req as any).user.id,       
            initialTenantId: (req as any).user.tenantId
        };
 
        const user = await userService.createUserClean(secureUserPayload);
        return res.status(201).json(user);      
    } catch (error: any) {
        return res.status(400).json({ message: 'User creation failed: ' + error.message });
    }
});
router.route('/:id').put(async (req: Request<{ id: string }, {}, any>, res: Response) => {
    try {
        
        
        const userService = getUserRepository(); // Ensure this maps to your initialized UserService instance
        const targetUserId = parseInt(req.params.id, 10);

        if (isNaN(targetUserId)) {
                 return res.status(400).json({ message: 'Invalid User identification ID format.' });
        }

        const loggedInTenantId = (req as any).user.tenantId;
        
        // Destructure to prevent payload poisoning of primary keys
        const { id, tenantId, ...updatableFields } = req.body;

        const updatedUser = await userService.updateUser(
            targetUserId, 
            loggedInTenantId, 
            updatableFields
        );

        return res.status(200).json(updatedUser); 
    } catch (error: any) {
        return res.status(400).json({ message: 'User update failed: ' + error.message });
    }
});


// ==========================================
// LEGACY COMPATIBILITY HANDLERS
// ==========================================

router.route('/')
    .get(async (req: Request, res: Response) => {
        try {
            
            
            const userService = getUserRepository(); 
            const activeTenantId = parseInt(req.query?.activeTenantId?.toString()!, 10);
            const roles = req.query?.roles?.toString().split(",");
           
            const users = await userService.getUsers(activeTenantId, roles);
            res.status(200).json(users);
        } catch (error: any) {
            console.error('Failed to retrieve users:', error.message || error);
            res.status(500).json({ message: "Failed to retrieve users: " + error.message });
        }
    });

router.route('/:id/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
           
            const tenantid = parseInt(req.params.ptenantId, 10);
            const userService = getUserRepository(); 
            const users = await userService.getUsersSimple(tenantid);
            res.status(200).json(users);
        } catch (error: any) {
            console.error('Failed to retrieve users:', error.message || error);
            res.status(500).json({ message: "Failed to retrieve users: " + error.message });
        }
    });

router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try { 
            const userService = getUserRepository(); 
            const userId = parseInt(req.params.id, 10); 
            
            const user = await userService.getById(userId);
            if (user) {
                const { password, ...userResponse } = user as any;
                res.status(200).json(userResponse);
            } else {
                res.status(404).json({ message: 'User not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve user by ID:', error.message || error);
            res.status(500).json({ message: 'Error retrieving user.' });
        }
    })
    .delete(async (req: Request<{ id: string }>, res: Response) => {
        const userId = parseInt(req.params.id, 10);
        try {
            const userService = getUserRepository(); 
            await userService.deleteUser(userId);
            res.status(204).send();
        } catch (error: any) {
            console.error('User deletion failed:', error.message || error);
            res.status(500).json({ message: 'User deletion failed: ' + error.message });
        }
    });

export default router;
