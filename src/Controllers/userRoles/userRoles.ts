import { Router, Request, Response } from 'express';
import { getUserRoleRepository } from '../../dependencies'; // 🌟 Importing your exact dependency injection getter

interface CreateRoleRequestBody {
    rolename: string;
    description?: string | null;
    isActive?: boolean;
    defaultHsnId?: number | null;
}

const router = Router();

// 🌟 Follows your exact pattern to verify repository initialization before running any routes
router.use((req, res, next) => {
    try {
        getUserRoleRepository(); 
        next();
    } catch (error: any) {
        console.error('UserRoleService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. User Role service not ready.' });
    }
});  

// ==========================================
// CRUD OPERATIONS
// ==========================================

// 🌟 Matches your multi-tenant GET and DELETE route parameter style
router.route('/:tenantId/:roleName')
    .get(async (req: Request, res: Response) => {
        try {
            const tenantId = parseInt(req.params.tenantId, 10);        
            const roleName = req.params.roleName; // Plain dictionary lookup text string
            
            const userRoleService = getUserRoleRepository(); 
            const aRole = await userRoleService.getRole(tenantId, roleName);
            
            if (!aRole) {
                return res.status(404).json({ message: 'Role profile not found.' });
            }
            res.status(200).json(aRole);
        } catch (error: any) {
            console.error('Failed to retrieve role profile:', error.message || error);
            res.status(500).json({ message: "Failed to retrieve role: " + error.message });
        }
    })
    .delete(async (req: Request, res: Response) => {
        try {
            const tenantId = parseInt(req.params.tenantId, 10);
            const roleName = req.params.roleName;
            
            const userRoleService = getUserRoleRepository();
            console.log(`Hitting delete role context for name: ${roleName} under tenant: ${tenantId}`);

            await userRoleService.deleteRole(tenantId, roleName);
            res.status(200).json({ message: "Role record successfully deleted." });
        } catch (error: any) {
            // 🌟 Intercepts MS SQL Server Error Code 547 (Foreign Key Reference Conflict)
            if (error.number === 547 || error.message?.includes('REFERENCE constraint')) {
                return res.status(409).json({ 
                    message: "Cannot delete this role. It is securely linked to active user profiles or security rules." 
                });
            }

            console.error('Failed to delete targeted role pattern:', error.message || error);
            res.status(500).json({ message: "Failed to delete role: " + error.message });
        }
    });

// 🌟 Matches your list fetching approach by tenantId parameter
router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            const userRoleService = getUserRoleRepository(); 
            const tenantId = parseInt(req.params.tenantId, 10);
            const roles = await userRoleService.getRoles(tenantId);
            res.status(200).json(roles);
        } catch (error: any) {
            console.error('Failed to retrieve roles list:', error.message || error);
            res.status(500).json({ message: "Failed to retrieve roles: " + error.message });
        }
    });

// 🌟 Matches your exact POST creation payload handling, extracting multi-tenant metadata from context
router.route('').post(async (req: Request<{}, {}, CreateRoleRequestBody>, res: Response) => {
    try {
        const userRoleService = getUserRoleRepository();

        if (!req.body.rolename) {
            return res.status(400).json({ message: 'Role Name is a mandatory field.' });
        }

        const secureRolePayload = {
            ...req.body,
            tenantId: (req as any).user.tenantId,        
            createdByUserId: (req as any).user.id       
        };
 
        const createdRole = await userRoleService.saveRoleClean(secureRolePayload);
        return res.status(201).json(createdRole);      
    } catch (error: any) {
        return res.status(400).json({ message: 'Role creation failed: ' + error.message });
    }
});

// 🌟 Matches your precise PUT method strategy, destructuring to avoid primary key poisoning
router.route('/:roleName').put(async (req: Request<{ roleName: string }, {}, any>, res: Response) => {
    try {
        const userRoleService = getUserRoleRepository(); 
        const targetRoleName = req.params.roleName;
        const loggedInTenantId = (req as any).user.tenantId;
        
        // Destructure to isolate primary key properties from updatable lines
        const { tenantId, rolename, ...updatableFields } = req.body;

        const updatedRole = await userRoleService.updateRole(
            loggedInTenantId,
            targetRoleName, 
            updatableFields
        );

        return res.status(200).json(updatedRole); 
    } catch (error: any) {
        return res.status(400).json({ message: 'Role update failed: ' + error.message });
    }
});

export default router;
