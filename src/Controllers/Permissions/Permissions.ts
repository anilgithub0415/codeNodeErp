// src/routes/PermissionRouter.ts
import { Router, Request, Response } from 'express';
import { getPermissionRepository } from '../../dependencies';
import { CreatePermissionDto } from '../../dto/PermissionDto';

const router = Router();

// Middleware to ensure PermissionService is available
router.use((req, res, next) => {
    try {
        getPermissionRepository(); 
        next();
    } catch (error: any) {
        console.error('PermissionService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Permission service not ready.' });
    }
}); 

// ==========================================
// GET: RETRIEVE A SPECIFIC PERMISSION
// ==========================================
router.route('/:tenantId/:id').get(async (req: Request, res: Response) => {
    try {
        const tenantId = parseInt(req.params.tenantId, 10);        
        const permissionId = parseInt(req.params.id, 10);
        const permissionService = getPermissionRepository(); 
        
        const aPermission = await permissionService.getPermission(tenantId, permissionId);
        return res.status(200).json(aPermission);
    } catch (error: any) {
        console.error('Failed to retrieve a permission:', error.message || error);
        return res.status(500).json({ "message": "Failed to retrieve a permission: " + error.message });
    }
});

// ==========================================
// GET: LIST ALL PERMISSIONS UNDER A TENANT
// ==========================================
router.route('/:tenantId').get(async (req: Request, res: Response) => {
    try {
        const permissionService = getPermissionRepository(); 
        const tenantId = parseInt(req.params.tenantId, 10);
        
        const permissions = await permissionService.getPermissions(tenantId);
        return res.status(200).json(permissions);
    } catch (error: any) {
        console.error('Failed to retrieve permissions:', error.message || error);
        return res.status(500).json({ "message": "Failed to retrieve permissions: " + error.message });
    }
});

// ==========================================
// POST: REGISTER A NEW PERMISSION
// ==========================================
router.route('').post(async (req: Request<{}, {}, CreatePermissionDto>, res: Response) => {
    try {
        const permissionService = getPermissionRepository();

        if (!req.body.permissionName) {
           return res.status(400).json({ message: 'Permission name is required' });
        }

        const securePermissionPayload = {
            ...req.body,
           
            createdByUserId: req.user.id        // Audit log identification stamp
        };
console.log('creating permission with ',securePermissionPayload);

        const permission = await permissionService.createPermissionClean(securePermissionPayload);
        return res.status(201).json(permission);    // ✅ 201 Created Status
    } catch (error: any) {
        console.error('Permission creation failed:', error.message || error);
        return res.status(400).json({ 'message': 'Permission creation failed: ' + error.message });
    }
});

// ==========================================
// PUT: MODIFY AN EXISTING PERMISSION
// ==========================================
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        const permissionService = getPermissionRepository();
        const targetPermissionId = parseInt(req.params.id, 10);

        if (isNaN(targetPermissionId)) {
            return res.status(400).json({ message: 'Invalid Permission identification ID path format parameter.' });
        }

        const loggedInTenantId = req.user.tenantId;
        const { id, tenantId, ...updatableFields } = req.body;

        const updatedPermission = await permissionService.updatePermission(
            targetPermissionId, 
            loggedInTenantId, 
            updatableFields
        );

        return res.status(200).json(updatedPermission); // ✅ 200 OK Status
    } catch (error: any) {
        console.error('Permission update failed:', error.message || error);
        return res.status(400).json({ 'message': 'Permission update failed: ' + error.message });
    }
});

export default router;
