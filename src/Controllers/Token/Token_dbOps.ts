

//Token_dbOps code below

import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {refreshTokens} from '../../memory/memoryStore';


import { AppDataSource } from '../../../data-source'; // Adjust import paths to match your project root
import { RefreshToken } from '../../entity/RefreshToken';
import { UserTenantContext } from '../../entity/UserTenantContext';
import { getUserRepository, getRefreshTokenRepository, getSeuritySettingsServiceRepository } from '../../dependencies'; 

require('dotenv').config();

interface JwtPayloadWithUsername extends JwtPayload {
    username: string;
}

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'aaa';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'aaa'; // You might not need this for UUID refresh tokens

const ACCESS_TOKEN_LIFETIME=process.env.ACCESS_TOKEN_LIFETIME || '5m'
const REFRESH_TOKEN_LIFETIME = process.env.REFRESH_TOKEN_LIFETIME

// In-memory storage (as in your login function)
//const refreshTokens: { [token: string]: { UserName: string } } = {};

export const method1 = async (req: Request, res: Response) => {
    console.log(' token 1');
    res.status(200).json({ 'message': 'token 1' });
};

export const method2 = async (req: Request, res: Response) => {
    console.log(' token 2');
    res.status(200).json({ 'message': ' tokene 2' });
};

//preserved on 22 Jul 2026 and modified version is below
// export const refreshtoken_preserve = async (req: Request, res: Response) => {

//     console.log(('method:refreshtoken'));
    
//     const { refreshToken } = req.body;

//     if (!refreshToken) {
//         return res.status(401).json({ 'error': 'Refreshtoken not provided' });
//     }

//     try {
       
        
//         // Check if the refresh token exists in our in-memory store
//         const refreshTokenData = refreshTokens[refreshToken];
        
//         console.log('at refresh refreshToken:',refreshToken,'  ,refreshTokenData:',refreshTokens[refreshToken]);

//         if (!refreshTokenData) {
//             return res.status(403).json({ 'error': 'Invalid refresh token' });
//         }

//         const UserName = refreshTokenData.UserName;

//         // Generate a new access token
//         const newAccessTokenPayload: JwtPayloadWithUsername = { UserName: UserName, username: 'user-from-refresh' }; // You might need to fetch actual username
//         //*.+
//         const newAccessToken = jwt.sign(newAccessTokenPayload, ACCESS_TOKEN_SECRET, { expiresIn: parseInt(ACCESS_TOKEN_LIFETIME) });

//         // Generate a new refresh token (optional, for rotation)
//         //*.+ i think dynamic UserName must be considered
//         const newRefreshToken = uuidv4();
//         refreshTokens[newRefreshToken] = { UserName: UserName };
//         delete refreshTokens[refreshToken]; // Invalidate the old refresh token

//         res.status(201).json({
//             message: 'Token refreshed successfully',
//             access_token: newAccessToken,
//             token_type: 'Bearer',
//             expires_in: 100,
//             refresh_token: newRefreshToken, // Send the new refresh token back
//         });
//     } catch (error: any) {
//         console.error('Error during refresh token:', error);
//         return res.status(500).json({ 'error': 'Internal server error during refresh' }); // More generic error for unexpected issues
//     }
// }; //replaced by below


//modified on 22 jul 2026

export const refreshtoken = async (req: Request, res: Response) => {

    
    
    const { refreshToken } = req.body;
    console.log(`📡 [Auth Sync]: Refresh request received for Token: ${refreshToken.substring(0,8)}...`);


    
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    // 1. Enforce that token is present in the request body wrapper
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token not provided' });
    }

        try {
        const refreshTokenRepo = AppDataSource.getRepository(RefreshToken); 
        const userTenantContextRepo = AppDataSource.getRepository(UserTenantContext);
        const userService = getUserRepository(); // Use service to fetch the profile manually
        const securitySettingsService = getSeuritySettingsServiceRepository();

        // 1. Locate token record cleanly using only columns native to the entity
        const savedTokenData = await refreshTokenRepo.findOne({
            where: { token: refreshToken }
            // REMOVED relations: ['user'] to fix compilation error
        });

        // 2. Fallback to 401 status code so the Angular Interceptor knows to clear cookies/session
        if (!savedTokenData) {
            console.warn(`Unauthorized access attempt using missing or deleted refresh token: ${refreshToken}`);
            return res.status(401).json({ message: 'Invalid or expired refresh token. Please sign in again.' });
        }

        // 3. Verify token life timelines cleanly against current clock parameters
        if (new Date() > new Date(savedTokenData.expiresAt)) {
            await refreshTokenRepo.remove(savedTokenData); // Clear stale records proactively
            console.log(`♻️ [Rotation]: Old token invalidated successfully for UserId: ${savedTokenData.userId}`);

            console.warn(`Refresh token timestamp expired for userId: ${savedTokenData.userId}`);
            return res.status(401).json({ message: 'Refresh token expired. Please sign in again.' });
        }

        const verifiedUserId = Number(savedTokenData.userId);

        // 4. FIX: Manually query user profile because relation doesn't exist on the entity
        // Adjust this method name if your custom userService has a findOne/findById equivalent
        const userRepo = AppDataSource.getRepository('User'); // Fallback direct table look up if Authenticate is exclusive to passwords
        const authenticatedUser = await userRepo.findOne({ where: { id: verifiedUserId } }) as any;

        if (!authenticatedUser) {
            return res.status(401).json({ message: 'Associated user profile no longer exists.' });
        }

        // 5. Re-fetch active contexts dynamically so token payloads stay real-time
        const userContexts = await userTenantContextRepo.createQueryBuilder('utc')
            .leftJoinAndSelect('utc.user', 'user')
            .leftJoinAndSelect('user.tenant', 'tenant')
            .leftJoinAndSelect('utc.role', 'role')
            .leftJoinAndSelect('role.rolePermissions', 'rolePermissions')
            .addSelect(['tenant.tenantId', 'tenant.tenantName'])
            .where('utc.userId = :id', { id: verifiedUserId })
            .getMany();

        // 6. Map entities to AvailableContext DTO definitions cleanly
        const availableContexts = userContexts.map(context => ({
            userId: context.userId,
            tenantId: context.tenantId,
            tenantName: context.user?.tenant?.tenantName || 'Unknown Tenant',
            roleName: context.roleName,
            permissions: context.role?.rolePermissions ? context.role.rolePermissions.map(p => p.permissionName) : []
        }));

        const defaultTenantId = availableContexts.length > 0 ? availableContexts[0].tenantId : authenticatedUser.tenantId || '';
        const defaultPermissions = availableContexts.length > 0 ? availableContexts[0].permissions : [];

        // 7. Re-compile full structural JWT access token payload architecture
        const payload = {
            userName: authenticatedUser.userName,
            userId: verifiedUserId,
            siteId: authenticatedUser.siteId!,
            clientId: authenticatedUser.clientId!,
            tenantId: authenticatedUser.tenantId!,
            roleName: 'Client',
            availableContexts: availableContexts
        };

        const currentAccessTokenLifetime = securitySettingsService.getSettings().accessTokenLifetime;
        const currentRefreshTokenLifetime = securitySettingsService.getSettings().refreshTokenLifetime;

        // 8. Sign fresh JWT access token set
        const newAccessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

        // 9. Implement Token Rotation (Invalidate old UUID, insert a brand-new one)
        await refreshTokenRepo.remove(savedTokenData); // Remove old record cleanly

        const newRefreshTokenString = uuidv4();
        const freshExpiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

        const replacementRefreshToken = new RefreshToken();
        replacementRefreshToken.token = newRefreshTokenString;
        replacementRefreshToken.userId = verifiedUserId;
        replacementRefreshToken.expiresAt = freshExpiresAt;
        replacementRefreshToken.deviceInfo = userAgent;

        await refreshTokenRepo.save(replacementRefreshToken);

//        console.log(`Token rotation fully finalized for user: ${authenticatedUser.userName}`);

console.log(`🚀 [Rotation Complete]: Brand new token pair stored and dispatched for Device: ${userAgent}`);

        // 10. Return matching properties exactly as expected by your Angular interceptor
        return res.status(200).json({
            access_token: newAccessToken,
            refresh_token: newRefreshTokenString,
            userId: verifiedUserId,
            siteId: authenticatedUser.siteId!,
            clientId: authenticatedUser.clientId!,
            availableContexts: availableContexts,
            expires_in: currentAccessTokenLifetime,
            tenantId: defaultTenantId,
            tenantType: 'INSTITUTE',
            roleName: 'Coordinator',
            permissions: defaultPermissions
        });



    } catch (error: any) {
        console.error('Critical exception encountered during Token Refresh lifecycle execution:', error.message || error);
        return res.status(500).json({ message: 'Internal server error during token refresh sequence.' });
    }
};