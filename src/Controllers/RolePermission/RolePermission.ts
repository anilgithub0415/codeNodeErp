// src/routes/RolePermissionRouter.ts
import { Router, Request, Response } from 'express';
import { getRolePermissionRepository } from '../../dependencies'; // Adjust import names based on your dependencies setup
import { CreateRolePermissionDto } from '../../dto/RolePermissionDto';

const router = Router();

// Middleware to ensure RolePermissionService is available
router.use((req, res, next) => {
    try {
        getRolePermissionRepository(); 
        next();
    } catch (error: any) {
        console.error('RolePermissionService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. RolePermission service not ready.' });
    }
}); 

// =========================================================================
// GET: RETRIEVE ALL MAPPED PERMISSIONS ASSIGNED TO A SPECIFIC ROLE
// =========================================================================
router.route('/:tenantId/:roleName').get(async (req: Request, res: Response) => {
    try {
        const tenantId = parseInt(req.params.tenantId, 10);        
        const roleName = req.params.roleName;
        const rolePermissionService = getRolePermissionRepository(); 
        
        // This returns the full collection array mapped to that role string
        const rolePermissions = await rolePermissionService.getPermissionsByRole(tenantId, roleName);
        return res.status(200).json(rolePermissions);
    } catch (error: any) {
        console.error('Failed to retrieve role permissions:', error.message || error);
        return res.status(500).json({ "message": "Failed to retrieve role permissions: " + error.message });
    }
});

// =========================================================================
// GET: LIST ALL ROLE-PERMISSION RELATION MATRIX LAYERS UNDER A TENANT
// =========================================================================
router.route('/:tenantId').get(async (req: Request, res: Response) => {
    try {
        const rolePermissionService = getRolePermissionRepository(); 
        const tenantId = parseInt(req.params.tenantId, 10);
        
        const allTenantMappings = await rolePermissionService.getAllRolePermissions(tenantId);
        return res.status(200).json(allTenantMappings);
    } catch (error: any) {
        console.error('Failed to retrieve tenant role permissions matrix:', error.message || error);
        return res.status(500).json({ "message": "Failed to retrieve tenant role permissions matrix: " + error.message });
    }
});

// =========================================================================
// POST: ASSIGN A NEW PERMISSION TO A ROLE (MAP RELATION)
// =========================================================================
router.route('').post(async (req: Request<{}, {}, CreateRolePermissionDto>, res: Response) => {
    try {
        const rolePermissionService = getRolePermissionRepository();

        if (!req.body.roleName || !req.body.permissionName) {
           return res.status(400).json({ message: 'Both roleName and permissionName properties are required.' });
        }

        const secureMappingPayload = {
            ...req.body,
            tenantId: req.user.tenantId // Lock down context block isolation namespace
        };

        const mappedRecord = await rolePermissionService.createRolePermissionClean(secureMappingPayload);
        return res.status(201).json(mappedRecord);    // ✅ 201 Created Status
    } catch (error: any) {
        console.error('RolePermission assignment failed:', error.message || error);
        return res.status(400).json({ 'message': 'RolePermission assignment failed: ' + error.message });
    }
});

// =========================================================================
// DELETE: REVOKE AN ASSIGNED PERMISSION FROM A ROLE
// =========================================================================
router.route('/:roleName/:permissionName').delete(async (req: Request, res: Response) => {
    try {
        const rolePermissionService = getRolePermissionRepository();
        const { roleName, permissionName } = req.params;
        const loggedInTenantId = req.user.tenantId;

        await rolePermissionService.deleteRolePermission(
            loggedInTenantId, 
            roleName, 
            permissionName
        );

        return res.status(200).json({ message: 'Permission revoked from role successfully.' }); // ✅ 200 OK Status
    } catch (error: any) {
        console.error('RolePermission revocation failed:', error.message || error);
        return res.status(400).json({ 'message': 'RolePermission revocation failed: ' + error.message });
    }
});

export default router;
