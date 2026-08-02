import { Router, Request, Response } from 'express';
import jwt , { JwtPayload } from 'jsonwebtoken';
import { getSeuritySettingsServiceRepository } from '../../dependencies';
 require('dotenv').config();
const router = Router();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'aaa';


//Note: This endpoint is for SuperAdmin to switchcontext means he will be pretend as any other role
router.post('/switch-context', async (req: Request, res: Response) => {
    try {
        const { targetTenantId, targetRoleName } = req.body;
        
        // 1. Extract the current user from the existing verified token/session
        // (Assuming you have an authentication middleware that sets req.user)
        const currentUser = req.user; 

        // 2. Guard: Only allow this if they are currently an active SuperAdmin
        if (currentUser.tenantId !== 0 && currentUser.roleName !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Forbidden: Only SuperAdmins can switch contexts.' });
        }

        // 3. Construct a NEW downgraded payload
        // This payload strip away the SuperAdmin status and establishes them as a pretended user
        const newPayload: JwtPayload = {
            userName: currentUser.userName,
            userId: currentUser.userId,
            siteId: currentUser.siteId,
            clientId: currentUser.clientId,
            
            // Crucial: Set the context to the target tenant, NOT zero
            tenantId: Number(targetTenantId), 
            roleName: targetRoleName || 'Client', // They are no longer 'SuperAdmin'
            
            // Dynamically assign permissions belonging to that tenant/role
            // You can query your database here to get exact permissions for this role, or use a preset list
            permissions: ['read:tenant-data'], 
            
            // Keep track of who they originally were so they can switch back later
            isImpersonating: true,
            originalTenantId: 0
        };

        // 4. Sign a brand new access token
        const securitySettingsService = getSeuritySettingsServiceRepository();
        const accessTokenLifetime = securitySettingsService.getSettings().accessTokenLifetime;
        
        const newAccessToken = jwt.sign(newPayload, ACCESS_TOKEN_SECRET, { expiresIn: accessTokenLifetime });

        // 5. Return the new token to the frontend
        return res.json({
            access_token: newAccessToken,
            tenantId: Number(targetTenantId),
            roleName: newPayload.roleName,
            permissions: newPayload.permissions,
            isImpersonating: true
        });

    } catch (error) {
        console.error('Error during context switch:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router