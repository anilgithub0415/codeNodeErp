// src/Controllers/Login/Login_1.ts
import { Router, Request, Response } from 'express';
// Use default import for the service
import * as LoginService from '../../services/LoginServiceTypeorm_1'; // Changed to import * as
import {  CreateUserDto, RegisterAndSubscribeDto } from '../../dto/CreateUser.dto';
import { getUserRepository } from '../../dependencies';
import { getRefreshTokenRepository } from '../../dependencies';
import { getSeuritySettingsServiceRepository } from '../../dependencies';
import { User } from '../../entity/User';
import { AppDataSource } from '../../../data-source';
import { SubscriptionPlanLookup } from '../../entity/SubscriptionPlanLookup';
import { UserRoleLookup } from '../../entity/UserRoleLookup';
import bcrypt from 'bcrypt';

import { v4 as uuidv4 } from 'uuid';
import { UserTenantContext } from '../../entity/UserTenantContext';
import { RefreshToken } from '../../entity/RefreshToken';
import  jwt from 'jsonwebtoken';
import { CreateUserAndContextDto } from '../../services/UserService';
import { EntityManager } from 'typeorm';
import { Tenant } from '../../entity/Tenant';
require('dotenv').config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'aaa';

//import { CreateTenantDto } from '../../Models/Tenant';
interface CreateUserInternalDTO {
    userName: string;  
    password?: string;
    displayName?: string;
    role?: UserRoleLookup;//userRole;//changed enum to lookup and made role field optional by '?'
    tenantId: number;
    googleId?: string;
}

// Define the response structure for successful registration
interface RegisterResponse {
    message: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    exp: number; // Access token expiration timestamp
    userId: number; // Added userId to response
    availableContexts: { // Added availableContexts to response
        tenantId: number;
        tenantName: string;
        roleName: string;
        permissions: string[];
    }[];
}

export async function  hashPassword(plainPassword: string): Promise<string> {
    // Generate a salt (recommended to use 10-12 rounds for good balance of security and performance)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
}
const router = Router();

// Define the structure for a single available context
interface AvailableContext {
    userId:number;
    tenantId: number;
    tenantName: string; // Include tenant name for display
    roleName: string;
    permissions: string[];
}
// --- Define JWT Payload for context-specific token ---
interface ContextSpecificJwtPayload {
    userId: number;
    userName: string;displayName:string;
    tenantId:number;
    roleName:string;
    siteId?:number;
    clientId?:number;
    //personId:number;
   // tenantId: number;
   // roleName: string;
    //permissions: string[];
    availableContexts:AvailableContext[];
    // Other standard JWT claims (iat, exp) are added by jwt.sign
}

// --- Define Request Body DTO for /select-context ---
interface SelectContextRequestBody {
    userId: number;
    refreshToken: string;
    tenantId: number;
    roleName: string;
    availableContexts:any[];
}

export function generateUUID():string{
    return uuidv4();
  }

router.post('/register-and-subscribeAtomic', async (req: Request<{}, {}, RegisterAndSubscribeDto>, res: Response) => 
{
    console.log('registering req.body:',req.body); 
    
    
    try {
        const result: RegisterResponse = await AppDataSource.manager.transaction(async transactionalEntityManager => {
            // Get service instances (these are the global ones from dependencies.ts)
           
            const userService = getUserRepository();
            // Repositories for lookups within the transaction
          
            const subscriptionPlanLookupRepo = transactionalEntityManager.getRepository(SubscriptionPlanLookup);
            const userRoleLookupRepo = transactionalEntityManager.getRepository(UserRoleLookup);

            if (!req.body.userName || !req.body.password || !req.body.displayName || !req.body.tenantType || !req.body.tenantName || !req.body.subscriptionPlan) {
                throw new Error('Missing required registration fields (userName, password, displayName, tenantType, tenantName, subscriptionPlan, contactEmail, firstName).');
            }
            
           
            // Fetch SubscriptionPlanLookup
            const subscriptionPlan = await subscriptionPlanLookupRepo.findOneBy({ planName: req.body.subscriptionPlan });
            if (!subscriptionPlan) {
                throw new Error(`Invalid subscription plan: ${req.body.subscriptionPlan}`);
            }
            
           // console.log('............trying to create tenant');
            
            // Step 1: Create the Tenant using the service's transactional method
          
           
            
            let aRoleName: string = '';
            aRoleName=req.body.roleType;
            // if(req.body.tenantType === 'INSTITUTE') {
            //     aRoleName = 'InstituteAdmin';
            // } else if(req.body.tenantType === 'INDIVIDUAL_TEACHER') {
            //     aRoleName = 'ClassTeacher';
            // } else if(req.body.tenantType === 'INDIVIDUAL_STUDENT') {
            //     aRoleName = 'StudentSolo';
            // } else {
            //     throw new Error(`Unsupported tenant type for initial role assignment: ${req.body.tenantType}`);
            // }

            //console.log('................................... aRole is:', aRoleName);

            // Validate that the determined role actually exists
            const userRoleLookup = await userRoleLookupRepo.findOneBy({ rolename: aRoleName });
            if (!userRoleLookup) {
                throw new Error(`Initial user role '${aRoleName}' not found in UserRoleLookup table.`);
            }
          //  console.log('........................ and in plan to assign userrole:', userRoleLookup);
            
            // Step 2: Create the User (global), Person, and initial UserTenantContext
            // Use the DTO that matches UserService.createUserAndContext
            const createUserAndContextDto: CreateUserAndContextDto = {
                // firstName: req.body.firstName,
                // lastName: req.body.lastName,
                // contactEmail: req.body.contactEmail,
                // contactPhone: req.body.contactPhone,
                password: req.body.password,
              
                initialRoleName: aRoleName, // Use the determined role name string
                userName: req.body.userName, // Pass userName for the global User
                displayName: req.body.displayName, // Pass displayName for the global User
                deviceInfo:'',
                
            };
           // console.log('...............................createUserAndContextDto:', createUserAndContextDto);
            
            const { user: savedUser, initialContext } = await userService.createUserAndContext(createUserAndContextDto, transactionalEntityManager); // <--- PASS MANAGER HERE
            
            //console.log('done with creating user and context.....................................before generateauthtoken:');
            
            // Step 3: Generate tokens using the service's transactional method
            // Pass the savedUser (global User) and deviceInfo
            const tokens = await LoginService.generateAuthTokens(savedUser, req.body.deviceInfo || '', transactionalEntityManager, initialContext); // <--- PASS MANAGER HERE

            // Return the result of the transaction
            return {
                message: 'Registration and subscription successful!',
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_in: tokens.AccessToken_expiresIn, // Standardized key
                exp: tokens.exp,
                userId: tokens.userId, displayName:tokens.displayName,// Include userId
                availableContexts: tokens.availableContexts // Include all contexts
            };
        }); // The transaction commits here if successful, rolls back if error inside

        // If we reach here, the transaction was successful and committed
        res.status(201).json(result);

    } catch (error: any) {
        console.error('Backend registration failed (transaction rolled back or token generation failed):', error.message || error);
        res.status(400).json({ message: error.message || 'Registration failed.' });
    }
});

//----------------------------------------------------------------------------------------------------------------------------------

//purposely preserved this and below is new gemini code

// --- NEW Endpoint: /api/auth/select-context ---
// router.post('/select-context', async (req: Request, res: Response) => {
//     console.log('.....................select-context hitting......................req.body:',req.body);
    
//     const { userId, refreshToken, tenantId, roleName }: SelectContextRequestBody = req.body;

//     const userService = getUserRepository();
//     const refreshTokenRepo = getRefreshTokenRepository();
//     const securitySettingsService = getSeuritySettingsServiceRepository();
//     const userTenantContextRepo = AppDataSource.getRepository(UserTenantContext);

//     try {
//         // 1. Validate the provided refresh token and userId
//         const storedToken = await refreshTokenRepo.findByToken(refreshToken);

//         if (!storedToken || storedToken.userId !== userId) {
//             //return res.status(401).json({ message: 'Invalid or unauthorized refresh token.' });//pending:commented as error displaying
//         }

//         if (new Date() > storedToken!.expiresAt) {
//             await refreshTokenRepo.deleteByToken(refreshToken); // Invalidate expired token
//             //return res.status(401).json({ message: 'Refresh token expired.' });//pending:commented as error displaying
//         }

//         // Optional: Invalidate the old refresh token immediately (token rotation)
//         await refreshTokenRepo.deleteByToken(refreshToken);

//         // 2. Get the global User entity
//         const user = await userService.getUserById(userId);
//         if (!user) {
//             //return res.status(404).json({ message: 'User associated with refresh token not found.' });//pending:commented as error displaying
//         }

//         // 3. Find the specific UserTenantContext for the requested tenantId and roleName
//         const userContext = await userTenantContextRepo.findOne({
//             where: {
//                 userId: userId,
//                 tenantId: tenantId,
//                 roleName: roleName,
//                 isActiveInContext: true // Ensure the context is active
//             },
//             relations: ['role', 'role.permissions'] // Eager load role and its permissions
//         });

//         if (!userContext || !userContext.role) {
//             //return res.status(403).json({ message: 'Requested context (tenant/role) is invalid or inactive for this user.' });//pending:commented as error displaying
//         }

//         // 4. Extract permissions for the selected context
//         const userPermissions = userContext!.role.permissions ? userContext!.role.permissions.map(p => p.permissionName) : [];

//         // 5. Generate a NEW, context-specific Access Token
//         const currentAccessTokenLifetime = securitySettingsService.getSettings().accessTokenLifetime;
//         const payload: ContextSpecificJwtPayload = {
//             userId: user!.id,
//             userName: user!.userName,
//             tenantId: userContext!.tenantId,
//             roleName: userContext!.roleName,
//             permissions: userPermissions
//         };
//         const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

//         // 6. Generate and save a NEW Refresh Token (for rotation)
//         const currentRefreshTokenLifetime = securitySettingsService.getSettings().refreshTokenLifetime;
//         const newRefreshTokenString = uuidv4();
//         const newExpiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

//         const newRefreshToken = new RefreshToken();
//         newRefreshToken.token = newRefreshTokenString;
//         newRefreshToken.userId = user!.id;
//         newRefreshToken.expiresAt = newExpiresAt;
//         newRefreshToken.deviceInfo = storedToken!.deviceInfo; // Keep the same device info
//         await refreshTokenRepo.save(newRefreshToken);

//         // 7. Send back the new access token and (optionally) the new refresh token
//         res.status(200).json({
//             access_token: accessToken,
//             refresh_token: newRefreshTokenString,// earlier was   newRefreshToken now refresh_token // Send new refresh token for rotation
//             expires_in: currentAccessTokenLifetime //earlier was  AccessToken_expiresIn // For frontend to track expiration
//         });

//     } catch (error: any) {
//         console.error('Error selecting context and generating new token:', error.message || error);
//         res.status(500).json({ message: 'Failed to select context: ' + error.message });
//     }
// });

//optimised this below
// router.post('/select-context', async (req: Request<{}, {}, SelectContextRequestBody>, res: Response) => 
// {
    
//     console.log('.... posting request to select-context at mm:ss:',new Date);// | date:'mm:ss'
    
    
//     const { userId, refreshToken, tenantId, roleName } = req.body;

//     const userService = getUserRepository();
//     const refreshTokenRepo = getRefreshTokenRepository();
//     const securitySettingsService = getSeuritySettingsServiceRepository();
//     const userTenantContextRepo = AppDataSource.getRepository(UserTenantContext);

//     try {
//         // 1. Validate the provided refresh token and userId
//         const storedToken = await refreshTokenRepo.findByToken(refreshToken);


//         if (!storedToken || storedToken.userId !== userId) {
//           //  return res.status(401).json({ message: 'Invalid or unauthorized refresh token.' });
//           console.log('Invalid or unauthorized refresh token.');
          
//         }

//         // if (new Date() > storedToken!.expiresAt) {
//         //     await refreshTokenRepo.deleteByToken(refreshToken); // Invalidate expired token
//         //    // return res.status(401).json({ message: 'Refresh token expired.' });
//         //    console.log('Refresh token expired.');
           
//         // }

//         // Optional: Invalidate the old refresh token immediately (token rotation)

     
     
//      var preserveDeviceInfoBeforeDeleteRefreshToken='';//storedToken!.deviceInfo;
//         await refreshTokenRepo.deleteByToken(refreshToken);

//         // 2. Get the global User entity
//         const user = await userService.getUserById(userId);
//         if (!user) {
//             //return res.status(404).json({ message: 'User associated with refresh token not found.' });
//             console.log('User associated with refresh token not found.');
            
//         }

//         // 3. Find the specific UserTenantContext for the requested tenantId and roleName
//         const userContext = await userTenantContextRepo.findOne({
//             where: {
//                 userId: userId,
//                 tenantId: tenantId,
//                 roleName: roleName,
//                 isActiveInContext: true // Ensure the context is active
//             },
//             relations: ['role', 'role.permissions','tenant'] // Eager load role and its permissions ,  ,tenant added now
//         });

        

//         if (!userContext || !userContext.role) {
//            // return res.status(403).json({ message: 'Requested context (tenant/role) is invalid or inactive for this user.' });
//            console.log('Requested context (tenant/role) is invalid or inactive for this user.');
           
//         }

//         // 4. Extract permissions for the selected context
//         const userPermissions = userContext!.role.permissions ? userContext!.role.permissions.map(p => p.permissionName) : [];

//         // 5. Generate a NEW, context-specific Access Token
//         const currentAccessTokenLifetime = securitySettingsService.getSettings().accessTokenLifetime;
//         const payload: ContextSpecificJwtPayload = {
//             userId: user!.id,
//             userName: user!.userName,displayName:user!.displayName!,
          
//            availableContexts:[{userId:user!.id,tenantId:userContext!.tenantId ,tenantName: userContext!.tenant.tenantName,roleName:userContext!.roleName ,permissions:userPermissions}]
//         };
//         const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

//         // 6. Generate and save a NEW Refresh Token (for rotation)
//         const currentRefreshTokenLifetime = securitySettingsService.getSettings().refreshTokenLifetime;
//         const newRefreshTokenString = uuidv4();
//         const newExpiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);


//         const newRefreshToken = new RefreshToken();
//         newRefreshToken.token = newRefreshTokenString;
//         newRefreshToken.userId = user!.id;
//         newRefreshToken.expiresAt = newExpiresAt;
//         newRefreshToken.deviceInfo = preserveDeviceInfoBeforeDeleteRefreshToken; // Keep the same device info //earlier was storedToken!.deviceInfo; 
//         await refreshTokenRepo.save(newRefreshToken);

//         console.log('.... returning response of posting request to select-context at mm:ss:',new Date);

//         // 7. Send back the new access token and (optionally) the new refresh token
//         res.status(200).json({
//             access_token: accessToken,
//             refresh_token: newRefreshTokenString, // Standardized key
//             expires_in: currentAccessTokenLifetime // Standardized key

//               // --- NEW: Include context details in the response body ---
//               ,userId: user!.id,
//               //added
//               displayName:user!.displayName,
//               tenantId: userContext!.tenantId,
//               tenantName: userContext!.tenant.tenantName, // Make sure tenant relation is loaded
//               tenantType:userContext!.tenant.tenantTypeName,
//               roleName: userContext!.roleName,
//               permissions: userPermissions
//               // --- END NEW ---
           

//         });

//     } catch (error: any) {
//         console.log('refreshtoken is:',refreshToken)
//         console.error('Error selecting context and generating new token:', error.message || error);
//         res.status(500).json({ message: 'Failed to select context: ' + error.message });
//     }
// });

//optimised above code
// 
router.post('/select-context', async (req: Request<{}, {}, SelectContextRequestBody>, res: Response) => {
    const { userId, refreshToken, tenantId, roleName } = req.body;
    let finalTenantId = Number(tenantId); 
    let storedTokenDeviceInfo: string | null | undefined;

    try {
        const result = await AppDataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {
            const userRepo = transactionalEntityManager.getRepository(User);
            const refreshTokenRepo = transactionalEntityManager.getRepository(RefreshToken);
            const userTenantContextRepo = transactionalEntityManager.getRepository(UserTenantContext);
            const tenantRepo = transactionalEntityManager.getRepository(Tenant);

            const [user, storedToken] = await Promise.all([
                userRepo.findOneBy({ id: userId }),
                refreshTokenRepo.findOneBy({ token: refreshToken })
            ]);

            // --- 1. Base Security Checks ---
            if (!storedToken || storedToken.userId !== userId) {
                throw new Error('Invalid or unauthorized refresh token.');
            }
            if (!user) {
                throw new Error('User associated with refresh token not found.');
            }
            if (new Date() > storedToken.expiresAt) {
                throw new Error('Refresh token expired.');
            }

            storedTokenDeviceInfo = storedToken.deviceInfo;
            await refreshTokenRepo.delete({ token: refreshToken });

            // --- 2. Evaluation Strategy Initialization ---
            let finalTenantId = Number(tenantId);
            let finalTenantName = 'Global System';
            let finalTenantType = 'SYSTEM';
            let finalRoleName = String(roleName);
            let userPermissions: string[] = [];
            let finalAvailableContexts: AvailableContext[] = req.body.availableContexts || [];

            // Core operational mapping markers
            let targetSiteId = user.siteId;
            let targetClientId = user.clientId;

            const isSuperAdminUser = user.tenantId === 0;

            // --- Inside router.post('/select-context') ---

if (isSuperAdminUser) {
    // --- 👑 SUPERADMIN IMPERSONATION FLOW ---
    if (finalTenantId !== 0) {
        console.log(`👑 SuperAdmin Spoofing: Bypassing checks to assume Tenant ID: ${finalTenantId}`);
        
        const targetTenant = await tenantRepo.findOneBy({ tenantId: finalTenantId });
        finalTenantName = targetTenant ? targetTenant.tenantName : 'Spoofed Tenant';
        finalTenantType = targetTenant ? targetTenant.tenantTypeName || 'INSTITUTE' : 'INSTITUTE';
        
        
        // Ensure permissions adjust based on the assumed administrative context
        userPermissions = finalAvailableContexts.find(cxt=>cxt.tenantId!==0)?.permissions!;
        finalRoleName = finalAvailableContexts.find(cxt=>cxt.tenantId!==0)?.roleName!

        // Lookup any active user mapped to this tenant to adopt their site/client identities
        const tenantUserSample = await userRepo.findOne({
            where: { tenantId: finalTenantId }
        });

        if (tenantUserSample) {
            targetSiteId = tenantUserSample.siteId;
            targetClientId = tenantUserSample.clientId;
        }
    } else {
        console.log('👑 SuperAdmin returning back to Global System Root Context.');
        finalTenantName = 'Global System (All Tenants)';
        finalTenantType = 'SYSTEM';
        finalRoleName = 'SuperAdmin';
        userPermissions = ['ALL_PRIVILEGES'];
    }

    // Keep the availableContexts dropdown array populated so the UI dropdown doesn't clear out!
    // (Reuse the raw logic or pass back the initial contexts array from req.body to prevent layout flickering)
    if (!finalAvailableContexts || finalAvailableContexts.length === 0) {
         // Fallback if frontend didn't pass it back
         finalAvailableContexts = req.body.availableContexts || [];
    }
}


            // --- 3. Generate NEW Context-Specific Access Token ---
            const securitySettingsService = getSeuritySettingsServiceRepository();
            const currentAccessTokenLifetime = securitySettingsService.getSettings().accessTokenLifetime;

            const payload: any = {
                userId: user.id,
                userName: user.userName,
                displayName: user.displayName!,
                tenantId: finalTenantId, 
                roleName: finalRoleName,   
                siteId: targetSiteId,       // 👈 FIXED: Uses the contextual spoofed identifier!
                clientId: targetClientId,   // 👈 FIXED: Uses the contextual spoofed identifier!
                availableContexts: finalAvailableContexts 
            };
            
            const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

            // --- 4. Generate and save a NEW Refresh Token ---
            const currentRefreshTokenLifetime = securitySettingsService.getSettings().refreshTokenLifetime;
            const newRefreshTokenString = uuidv4();
            const newExpiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

            const newRefreshToken = new RefreshToken();
            newRefreshToken.token = newRefreshTokenString;
            newRefreshToken.userId = user.id;
            newRefreshToken.expiresAt = newExpiresAt;
            newRefreshToken.deviceInfo = storedTokenDeviceInfo;
            await refreshTokenRepo.save(newRefreshToken);



            // --- 5. Return Complete Response ---
            return {
                access_token: accessToken,
                refresh_token: newRefreshTokenString,
                expires_in: currentAccessTokenLifetime,
                userId: user.id,
                displayName: user.displayName,
                tenantId: finalTenantId,
                tenantName: finalTenantName,
                tenantType: finalTenantType,
                roleName: finalRoleName,
                permissions: userPermissions,
                availableContexts: finalAvailableContexts 
            };
        });

        res.status(200).json(result);

    } catch (error: any) {
        console.error('Error selecting context and generating new token:', error.message);
        res.status(400).json({ message: 'Failed to select context: ' + error.message });
    }
});



router.post('/', async (req: Request, res: Response) => {
    try {
        const credentials = req.body;
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const result = await LoginService.Login(credentials, userAgent);

      
        
        res.status(200).json(result);
    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            res.status(401).json({ message: 'Invalid credentials' });
        } else {
            console.error('Login route error:', error.message || error);
            res.status(500).json({ message: 'Login failed: ' + error.message });
        }
    }
});

router.put('/', async (req: Request, res: Response) => {
    try {
        const refreshTokenData = req.body; // Renamed to clarify it's an object with refreshToken property
        await LoginService.Logout(refreshTokenData);
        res.status(204).send();
    } catch (error: any) {
        console.error('Logout route error:', error.message || error);
        res.status(500).json({ message: 'Logout failed: ' + error.message });
    }
});

// --- Google OAuth Callback Endpoint ---
// This route will be accessible at /api/login/auth/google/callback as per server.ts mounting
// router.get('/auth/google/callback', async (req: Request, res: Response) => {
//     console.log('Atleast u r hitting here................ great!');

//     try {
//         const code = req.query.code as string;
//         if (!code) {
//             return res.status(400).json({ message: 'Authorization code missing.' });
//         }

//         const userAgent = req.headers['user-agent'] || 'Unknown Device';

//         const result = await LoginService.LoginWithGoogle(code, userAgent);

//         const frontendRedirectUrl = `http://localhost:4200/emp`; // Your Angular success route
//         // Send tokens via query parameters or hash for local testing, consider cookies for production
//         return res.redirect(`${frontendRedirectUrl}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&role=${result.Role}&userId=${result.userId}`);

//     } catch (error: any) {
//         console.error('Google OAuth callback error:', error.message || error);
//         return res.redirect(`http://localhost:4200/auth-error?message=${encodeURIComponent(error.message || 'Google login failed')}`);
//     }
// });

export default router; // Use default export for the router