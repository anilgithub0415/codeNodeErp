// src/Controllers/Login/Login_1.ts
import { Router, Request, Response } from 'express';
// Use default import for the service
import * as LoginService from '../../services/LoginServiceTypeorm_1'; // Changed to import * as
import {  CreateUserDto, RegisterAndSubscribeDto } from '../../dto/CreateUser.dto';
import { BackendCreateTenantDto } from '../../dto/tenant.dto';
import { getTenantServiceRepository,getUserRepository } from '../../dependencies';
import { getRefreshTokenRepository } from '../../dependencies';
import { getSettingsServiceRepository } from '../../dependencies';
import { User } from '../../entity/User';
import { AppDataSource } from '../../../data-source';
import { Tenant } from '../../entity/Tenant';
import { TenantTypeLookup } from '../../entity/TenantTypeLookup';
import { SubscriptionPlanLookup } from '../../entity/SubscriptionPlanLookup';
import { UserRoleLookup } from '../../entity/UserRoleLookup';
import bcrypt from 'bcrypt';

import { v4 as uuidv4 } from 'uuid'; 
import { UserTenantContext } from '../../entity/UserTenantContext';
import { RefreshToken } from '../../entity/RefreshToken';
import  jwt from 'jsonwebtoken';
import { CreateUserAndContextDto } from '../../services/UserService';
import { EntityManager } from 'typeorm';
require('dotenv').config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'aaa';

//import { CreateTenantDto } from '../../Models/Tenant';
interface CreateUserInternalDTO {
    userName: string;  
    password?: string;
    displayName?: string;
    role?: UserRoleLookup;//userRole;//changed enum to lookup and made role field optional by '?'
    tenantId: string;
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
        tenantId: string;
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
    tenantId: string;
    tenantName: string; // Include tenant name for display
    roleName: string;
    permissions: string[];
}
// --- Define JWT Payload for context-specific token ---
interface ContextSpecificJwtPayload {
    userId: number;
    userName: string;displayName:string;
    tenantId:string;
    roleName:string;
    //personId:number;
   // tenantId: string;
   // roleName: string;
    //permissions: string[];
    availableContexts:AvailableContext[];
    // Other standard JWT claims (iat, exp) are added by jwt.sign
}

// --- Define Request Body DTO for /select-context ---
interface SelectContextRequestBody {
    userId: number;
    refreshToken: string;
    tenantId: string;
    roleName: string;
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
            const tenantService = getTenantServiceRepository();
            const userService = getUserRepository();
            // Repositories for lookups within the transaction
            const tenantTypeLookupRepo = transactionalEntityManager.getRepository(TenantTypeLookup);
            const subscriptionPlanLookupRepo = transactionalEntityManager.getRepository(SubscriptionPlanLookup);
            const userRoleLookupRepo = transactionalEntityManager.getRepository(UserRoleLookup);

            if (!req.body.userName || !req.body.password || !req.body.displayName || !req.body.tenantType || !req.body.tenantName || !req.body.subscriptionPlan) {
                throw new Error('Missing required registration fields (userName, password, displayName, tenantType, tenantName, subscriptionPlan, contactEmail, firstName).');
            }
            
            // Fetch TenantTypeLookup
            const tenantType = await tenantTypeLookupRepo.findOneBy({ typeName: req.body.tenantType });
            if (!tenantType) {
                throw new Error(`Invalid tenant type: ${req.body.tenantType}`);
            }
            // Fetch SubscriptionPlanLookup
            const subscriptionPlan = await subscriptionPlanLookupRepo.findOneBy({ planName: req.body.subscriptionPlan });
            if (!subscriptionPlan) {
                throw new Error(`Invalid subscription plan: ${req.body.subscriptionPlan}`);
            }
            
           // console.log('............trying to create tenant');
            
            // Step 1: Create the Tenant using the service's transactional method
            const newTenantDto: BackendCreateTenantDto = {
                tenantName: req.body.tenantName,
                tenantType: req.body.tenantType,
                subscriptionPlan: req.body.subscriptionPlan,
                isActive: true
            };
            const savedTenant = await tenantService.CreateTenant(newTenantDto, transactionalEntityManager); // <--- PASS MANAGER HERE
            
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
                initialTenantId: savedTenant.tenantId, // Use ID from newly saved tenant
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
//     const settingsService = getSettingsServiceRepository();
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
//         const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime;
//         const payload: ContextSpecificJwtPayload = {
//             userId: user!.id,
//             userName: user!.userName,
//             tenantId: userContext!.tenantId,
//             roleName: userContext!.roleName,
//             permissions: userPermissions
//         };
//         const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

//         // 6. Generate and save a NEW Refresh Token (for rotation)
//         const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime;
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
//     const settingsService = getSettingsServiceRepository();
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
//         const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime;
//         const payload: ContextSpecificJwtPayload = {
//             userId: user!.id,
//             userName: user!.userName,displayName:user!.displayName!,
          
//            availableContexts:[{userId:user!.id,tenantId:userContext!.tenantId ,tenantName: userContext!.tenant.tenantName,roleName:userContext!.roleName ,permissions:userPermissions}]
//         };
//         const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

//         // 6. Generate and save a NEW Refresh Token (for rotation)
//         const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime;
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

router.post('/select-context', async (req: Request<{}, {}, SelectContextRequestBody>, res: Response) => {
    
    console.log('.... started  posting request to select-context at mm:ss:',new Date);

    const { userId, refreshToken, tenantId, roleName } = req.body;
    let storedTokenDeviceInfo: string | null | undefined;

    try {
        // Wrap the entire process in a single database transaction
        const result = await AppDataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {

            // Use the transactional EntityManager for all operations
            const userRepo = transactionalEntityManager.getRepository(User);
            const refreshTokenRepo = transactionalEntityManager.getRepository(RefreshToken);
            const userTenantContextRepo = transactionalEntityManager.getRepository(UserTenantContext);

            // Fetch the user and token in a single, parallel batch
            const [user, storedToken] = await Promise.all([
                userRepo.findOneBy({ id: userId }),
                refreshTokenRepo.findOneBy({ token: refreshToken })
            ]);

            // --- 1. Validation Checks ---
            if (!storedToken || storedToken.userId !== userId) {
                throw new Error('Invalid or unauthorized refresh token.');
            }
            if (!user) {
                throw new Error('User associated with refresh token not found.');
            }
            if (new Date() > storedToken.expiresAt) {
                throw new Error('Refresh token expired.');
            }

            // Store device info before deletion
            storedTokenDeviceInfo = storedToken.deviceInfo;
            // 2. Invalidate the old refresh token inside the transaction
            await refreshTokenRepo.delete({ token: refreshToken });

            // 3. Find the specific UserTenantContext
            const userContext = await userTenantContextRepo.findOne({
                where: {
                    userId: userId,
                    tenantId: tenantId,
                    roleName: roleName,
                    isActiveInContext: true
                },
                relations: ['role', 'role.permissions', 'tenant'] //removed , 'person'
            });

            if (!userContext || !userContext.role) {
                throw new Error('Requested context (tenant/role) is invalid or inactive for this user.');
            }

            // 4. Extract permissions
            const userPermissions = userContext.role.permissions ? userContext.role.permissions.map((p:any) => p.permissionName) : [];

            // 5. Generate NEW Access Token
            const settingsService = getSettingsServiceRepository();
            const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime;

            const payload: ContextSpecificJwtPayload = {
                userId: user.id,
                userName: user.userName,
                displayName: user.displayName!,
                tenantId: userContext.tenantId,
                roleName: userContext.roleName,
               // personId: userContext.person.id,
                availableContexts: [{
                    userId: user.id,
                    tenantId: userContext.tenantId,
                    tenantName: userContext.tenant.tenantName,
                    roleName: userContext.roleName,
                    permissions: userPermissions
                }]
            };
            const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

            // 6. Generate and save a NEW Refresh Token
            const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime;
            const newRefreshTokenString = uuidv4();
            const newExpiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

            const newRefreshToken = new RefreshToken();
            newRefreshToken.token = newRefreshTokenString;
            newRefreshToken.userId = user.id;
            newRefreshToken.expiresAt = newExpiresAt;
            newRefreshToken.deviceInfo = storedTokenDeviceInfo;
            await refreshTokenRepo.save(newRefreshToken);

            console.log('.... returning response of posting request to select-context at mm:ss:',new Date);

            // 7. Return the final data
            return {
                access_token: accessToken,
                refresh_token: newRefreshTokenString,
                expires_in: currentAccessTokenLifetime,
                userId: user.id,
                displayName: user.displayName,
                tenantId: userContext.tenantId,
                tenantName: userContext.tenant.tenantName,
                tenantType: userContext.tenant.tenantTypeName,
                roleName: userContext.roleName,
                permissions: userPermissions
            };
        });

        // If transaction is successful, send the response
        res.status(200).json(result);

    } catch (error: any) {
        // If an error occurs inside the transaction, it is automatically rolled back
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