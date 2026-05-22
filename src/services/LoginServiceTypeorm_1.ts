// src/services/LoginServiceTypeorm_1.ts
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../entity/RefreshToken';
import { User } from '../entity/User';

// Import getters from the central dependencies file
import { getUserRepository, getRefreshTokenRepository, getSettingsServiceRepository } from '../dependencies';
import { CreateUserDto } from '../dto/CreateUser.dto';
import { UserRoleLookup } from '../entity/UserRoleLookup';
import { AppDataSource } from '../../data-source';
import { EntityManager } from 'typeorm';
import { UserTenantContext } from '../entity/UserTenantContext';

// Google OAuth specific imports
// import { OAuth2Client } from 'google-auth-library';

// --- NEW: Access token secret and refresh token secret from process.env ---
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-fallback-access-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-fallback-refresh-secret';
// --- END NEW ---

// Google OAuth config from .env (ensure .env is loaded in server.ts)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!; // This must be the full path: /api/login/auth/google/callback


// Define the structure for a single available context
interface AvailableContext {
    tenantId: string;
    tenantName: string; // Include tenant name for display
    roleName: string;
    permissions: string[];
}

// Define the JWT Payload structure for the context-specific access token
interface ContextSpecificJwtPayload {
    userId: number;
    userName: string;
    tenantId: string;
    roleName: string;
    permissions: string[];
    // Other standard JWT claims (iat, exp) are added by jwt.sign
}
interface JwtPayload {
    // userName: string;
    // role: UserRoleLookup;// string;//changed enum to lookup
    // exp?: number;
    // userId?: number;
    // tenantId:string;
    // permissions: string[]; 
    userId: number;
    userName: string;
    // This initial token will contain all available contexts
    availableContexts: AvailableContext[];
    // Other standard JWT claims (iat, exp) are added by jwt.sign
}

// Define the return type of the Login function
interface LoginResponse {
    access_token: string;
    refresh_token: string;
    userId: number;
    availableContexts: AvailableContext[];
    expires_in: number; //earlier was AccessToken_expiresIn
    tenantId:string;
    tenantType:string;
    roleName:string;
}

// Define the return type of the generateAuthTokens function
interface GenerateAuthTokensResponse {
    access_token: string;
    refresh_token: string;
    userId: number;displayName:string;
    availableContexts: AvailableContext[];
    AccessToken_expiresIn: number;
    exp: number; // Expiration timestamp of the access token
}

// Define the return type of the RefreshAccessToken function
interface RefreshAccessTokenResponse {
    access_token: string;
    newRefreshToken?: string;
    userId: number;
    tenantId: string;
    roleName: string;
    permissions: string[];
    AccessToken_expiresIn: number;
}
// // Google OAuth Client instance, initialized here as it uses constants
// const googleOAuthClient = new OAuth2Client(
//     GOOGLE_CLIENT_ID,
//     GOOGLE_CLIENT_SECRET,
//     GOOGLE_REDIRECT_URI
// );

/**
 * !!! IMPORTANT !!!
 * The initializeLoginService function is now absorbed by initializeDependencies.
 * This file (LoginService) should NOT have its own initialization function
 * that deals with AppDataSource or repository instantiation.
 * It should rely on the getters from dependencies.ts.
 */
// export async function initializeLoginService(): Promise<void> {
//     // This function is no longer needed here as initializeDependencies handles it.
//     // Keep this as a placeholder if other parts of your app explicitly call it.
//     // Otherwise, it can be removed.
//     console.warn("initializeLoginService is deprecated. Use initializeDependencies from central file.");
// }

// //new
// const registerUser = async(newUserDto:CreateUserDto):Promise<User>=>{
//     if (!this.tenantRepository || !this.tenantTypeLookupRepository || !this.subscriptionPlanLookupRepository) {
//         throw new Error("TenantService repositories not initialized. Call init() first.");
//     }
// }


// const generateAuthTokens= async (newUser: User, manager?: EntityManager): Promise<any> => {
//     console.log('......................... m in generateAuthToken newUser:', newUser);
    
//     // Get service instances (these are the global ones from dependencies.ts)
//     const userService = getUserRepository(); // This returns UserService instance
//     const refreshTokenService = getRefreshTokenRepository(); // This returns RefreshTokenService instance
//     const settingsService = getSettingsServiceRepository(); // This returns SettingsService instance
//     const userRoleLookupRepo = manager ? manager.getRepository(UserRoleLookup) : AppDataSource.getRepository(UserRoleLookup); // Get repo directly for UserRoleLookup

//     try {
//         if (!newUser) {
//             throw new Error('Invalid credentials');
//         }
        
//         if (typeof newUser.id === 'undefined' || newUser.id === null) {
//             console.error('CRITICAL ERROR: newUser object passed to generateAuthTokens is missing its ID. This user was likely not saved to the database yet or save failed.');
//             throw new Error('New user missing ID. User must be saved to database before generating tokens.');
//         }
        
//         console.log('................................**************************newUser.id:', newUser.id);
        
//         // --- FIX: Fetch the user using the transactional context ---
//         // Use the getById method of UserService, passing the manager
//         const newUser_confirmed = await userService.getById(newUser.id, manager);
//         console.log('..............................newUser_confirmed:', newUser_confirmed);
        
//         if (!newUser_confirmed) {
//             console.error(`ERROR: User with ID ${newUser.id} not found in current transactional context.`);
//             throw new Error('Could not retrieve newly created user details within transaction.');
//         }

//         // Fetch permissions for the user's role using the transactional repository for UserRoleLookup
//         const userRole = await userRoleLookupRepo.findOne({
//             where: { rolename: newUser_confirmed.role.rolename },
//             relations: ['permissions']
//         });

//         if (!userRole) {
//             throw new Error(`Role '${newUser_confirmed.role.rolename}' not found for user ${newUser_confirmed.userName}. Cannot generate tokens.`);
//         }
//         console.log('........................intermediete: User role and permissions fetched.');

//         const userPermissions = userRole.permissions ? userRole.permissions.map(p => p.permissionName) : [];
        
//         const payload: JwtPayload = {
//             userName: newUser_confirmed.userName,
//             role: newUser_confirmed.role,//pending neeed i think proper userRole
//             userId: newUser_confirmed.id,
//             tenantId: newUser_confirmed.tenantId,
//             permissions: userPermissions
//         };
        
//         const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime;
//         const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime;
        
//         console.log('.................................... going to jwt sign............for newUser.id:', newUser_confirmed.id);
        
//         const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });
//         const decodedAccessToken = jwt.decode(accessToken) as JwtPayload;
//         const accessTokenExpTimestamp = decodedAccessToken.exp;

//         const refreshTokenString = uuidv4();
//         const expiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

//         console.log('..................................its just before refreshtoken save');
        
//         const newRefreshToken = new RefreshToken();
//         newRefreshToken.token = refreshTokenString;
//         newRefreshToken.user = newUser_confirmed; // Assign the full User object
//         newRefreshToken.expiresAt = expiresAt;
//         newRefreshToken.deviceInfo = ''; // Ensure this is set or nullable in entity

//         console.log('..............................newRefreshToken', newRefreshToken);

//         // --- FIX: Save the refresh token using the transactional service method ---
//         await refreshTokenService.save(newRefreshToken, manager);
//         // --- END FIX ---
        
//         console.log('done.................................. refreshtoken save');
        
//         return {
//             access_token: accessToken,
//             refresh_token: refreshTokenString,
//             AccessToken_expiresIn: currentAccessTokenLifetime,
//             exp: accessTokenExpTimestamp!
//         };
//     } catch (error: any) {
//         console.error('Error during generateAuthTokens:', error.message || error);
//         throw error;
//     }
// };
                                //<!--newUser: User-->
const generateAuthTokens = async (newUser: any, deviceInfo: string = '', manager?: EntityManager,  initialContext?: any): Promise<GenerateAuthTokensResponse> => 
{
    console.log('......................... m in generateAuthTokens newUser:', newUser.id);
    
    // Get service instances (these are the global ones from dependencies.ts)
    const userService = getUserRepository(); // This returns UserService instance
    const refreshTokenService = getRefreshTokenRepository(); // This returns RefreshTokenService instance
    const settingsService = getSettingsServiceRepository(); // This returns SettingsService instance
    const userTenantContextRepo = manager ? manager.getRepository(UserTenantContext) : AppDataSource.getRepository(UserTenantContext);

    try {
        //console.log('............below purposely commented throw error if userid not found below');        
        // if (!newUser || typeof newUser.id === 'undefined' || newUser.id === null) {
        //     console.error('CRITICAL ERROR: newUser object passed to generateAuthTokens is missing its ID. This user was likely not saved to the database yet or save failed.');
        //     throw new Error('New user missing ID. User must be saved to database before generating tokens.');
        // } 
        
        // Fetch the user using the transactional context (if manager is provided)
        // This ensures the user object is fully populated, especially if it was just created.
       // console.log('.......calling getbyuserid......................');
        
        const newUser_confirmed = await userService.getUserById(newUser.id, manager);
        
       
        if (!newUser_confirmed) {
            console.error(`ERROR: User with ID ${newUser.id} not found in current transactional context.`);
            throw new Error('Could not retrieve newly created user details within transaction.');
        }

        // 1. Fetch all active UserTenantContexts for this authenticated User
        // Eager load tenant, role, and role's permissions
        var userContexts;
        userContexts     = await userTenantContextRepo.find({
            where: { userId: newUser_confirmed.id, isActiveInContext: true },
            relations: ['tenant', 'role', 'role.permissions'] // Load tenant, role, and role's permissions
        });

     //   console.log('userContexts are:',userContexts);
        
        // //assign single context values to all elements of array
        // if(initialContext){
        //     userContexts= userContexts.filter(acontext=>acontext.tenantId=initialContext.tenantId) ;
        // }

        if (userContexts.length === 0) {
            throw new Error(`No active contexts found for user ${newUser_confirmed.userName}. Cannot generate tokens.`);
        }

        // 2. Map UserTenantContexts to AvailableContext DTOs
        var availableContexts: AvailableContext[] = userContexts.map(context => ({
            tenantId: context.tenantId,
            tenantName: context.tenant.tenantName, // Assuming tenant name is available on the loaded tenant object
            tenantType:context.tenant.tenantType,
            roleName: context.roleName,
            permissions: context.role.permissions ? context.role.permissions.map(p => p.permissionName) : []
        }));
     

        //only while registration (i think) initialContext is passed and below condition is true ----------------------------------------------------------
                    var aContext=null;
                    //if initialContext sent that means prefered or newly registering user context is passed
                    if(initialContext){ //this situation only we are expecting while registration
                     availableContexts=availableContexts.filter(item=>item.tenantId==initialContext.tenantId) ;
                    }
        //------------------- only while registration ---------------------------------------------------------------            


        // 3. Create JWT Payload
        const payload: JwtPayload = {
            userName: newUser_confirmed.userName,
            userId: newUser_confirmed.id,
            availableContexts:  availableContexts// Include all contexts in the initial token
        };
        
        const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime;
        const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime;
        
        console.log('.................................... going to jwt sign............for newUser.id:', newUser_confirmed.id,'now availableContexts.length is:',availableContexts.length,' payload passed:',payload);
        
        // 4. Generate Access Token
        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });
        const decodedAccessToken = jwt.decode(accessToken) as JwtPayload & { exp: number }; // Add exp to decoded type
        const accessTokenExpTimestamp = decodedAccessToken.exp;

        // 5. Generate and Save Refresh Token
        const refreshTokenString = uuidv4();
        const expiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);
        
        const newRefreshToken = new RefreshToken();
        newRefreshToken.token = refreshTokenString;
        newRefreshToken.userId = newUser_confirmed.id;
        newRefreshToken.expiresAt = expiresAt;
        newRefreshToken.deviceInfo = deviceInfo; // Use the provided deviceInfo
        
        //console.log('..............................newRefreshToken', newRefreshToken);
        
        await refreshTokenService.save(newRefreshToken, manager); // Save using transactional service method
        
       // console.log('done.................................. refreshtoken save');
        console.log('returning availableContexts to frontend:',availableContexts);
        console.log('also newUser_confirmed passing:',newUser_confirmed);
        
        // 6. Return the response
        return {
            access_token: accessToken,
            refresh_token: refreshTokenString,
            userId: newUser_confirmed.id, displayName:newUser_confirmed.displayName!,
            availableContexts: availableContexts, // Return the contexts to the frontend
            AccessToken_expiresIn: currentAccessTokenLifetime,
            exp: accessTokenExpTimestamp
        };
    } catch (error: any) {
        console.error('Error during generateAuthTokens:', error.message || error);
        throw error;
    }
};
//preserved
//New
// const generateAuthTokens_preserved=async(newUser:User):Promise<any>=>{
    
//                 console.log('......................... m in generateAuthToken newUser:',newUser);
                
//                     const userRepo = getUserRepository();
//                     const refreshTokenRepo = getRefreshTokenRepository();
//                     const settingsService = getSettingsServiceRepository();
                 
//                     try {
                        
//                         if (!newUser) {
//                             throw new Error('Invalid credentials');
//                         }
                     
//                         if (typeof newUser.id === 'undefined') {
//                             throw new Error('new user missing ID.');
//                         }
                        
//                         console.log('................................**************************newUser.id:',newUser.id)                         
//   //-added 
//   //just see here , we are trying to get new user details
//   const userRepo=AppDataSource.getRepository(User);
//   const newUser_confirmed=await userRepo.findOne({where:{id:newUser.id}})
//   console.log('..............................newUser_confirmed:',newUser_confirmed);
  

//   //end added    
                        
//                     // Fetch permissions for the user's role
//                     const roleRepository = AppDataSource.getRepository(UserRoleLookup);
//                     const userRole = await roleRepository.findOne({
//                         where: { rolename: newUser.role.rolename },
//                         relations: ['permissions'] // IMPORTANT: Load the permissions relation
//                     });

//                     if (!userRole) {
//                         throw new Error(`Role '${newUser.role.rolename}' not found for user ${newUser.userName}. Cannot generate tokens.`);
//                     }
//             console.log('........................intermediete');

//                     // Extract permission names
//                     const userPermissions = userRole.permissions ? userRole.permissions.map(p => p.permissionName) : [];

                                
//                                 const payload: JwtPayload = {
//                                     userName: newUser.userName,
//                                     role: newUser.role,
//                                     userId: newUser.id, 
                                    
//                                     tenantId: newUser.tenantId, //added confirm it
//                                     permissions: userPermissions 
//                                 };
//                                 const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime; // Use accessTokenLifetime
//                                 const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime; // Use refreshTokenLifetime
//             console.log('.................................... going to jwt sign............for  newUser.id:', newUser.id);
            


//                                 const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });
                            
                                
//                     const refreshTokenString = uuidv4();
//                     const expiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

                    
//                     const newRefreshToken = new RefreshToken();
                    
//                     newRefreshToken.token = refreshTokenString;
//                  //   newRefreshToken.user=newUser;
//                   newRefreshToken.userId = newUser.id;//newRefreshToken.user=newUser;
//                 // newRefreshToken.userId =55; //static userid inserted
                
//                     newRefreshToken.expiresAt = expiresAt;
//                     newRefreshToken.deviceInfo='';
//             console.log('..................................its just before refreshtoken save');
//             console.log('..............................newRefreshToken',newRefreshToken);

//                     //New refresh token saved to DB for user ${authenticatedUser.userName} (${deviceInfo}): ${refreshTokenString}`);
//                     await refreshTokenRepo.save(newRefreshToken);
                    
//             console.log('done.................................. refreshtoken save');
//                     return {
//                         access_token: accessToken,
//                         refresh_token: refreshTokenString,
//                         //role: newUser.role,
//                     // userId: newUser.id,
//                         AccessToken_expiresIn: currentAccessTokenLifetime,
                        
//                     };
//                     } catch (error: any) {
//                         console.error('Error during Login:', error.message || error);
//                         throw error;
//                     }
// }



















// --- MODIFIED Login function ---//changed enum to lookup
// const Login = async (credentials: any, deviceInfo: string): Promise<{ access_token: string; refresh_token: string; role: UserRoleLookup; userId: number ,  AccessToken_expiresIn: any}> => 
// {
//     // Get instances from the dependency getters
//     const userRepo = getUserRepository();
//     const refreshTokenRepo = getRefreshTokenRepository();
//     const settingsService = getSettingsServiceRepository();

//     try {
//         console.log('credentials.userName:', credentials.userName,'pwd:',credentials.password);
//         const authenticatedUser = await userRepo.Authenticate(credentials.userName, credentials.password);
//         if (!authenticatedUser) {
//             throw new Error('Invalid credentials');
//         }

//         if (typeof authenticatedUser.id === 'undefined') {
//             throw new Error('Authenticated user missing ID.');
//         }

//         //console.log(`Checking for existing session for user ${authenticatedUser.userName} on device: ${deviceInfo}`);
//         await refreshTokenRepo.deleteExistingTokenForDevice(authenticatedUser.id, deviceInfo);
//         console.log(`Any previous refresh token for user ${authenticatedUser.userName} on device ${deviceInfo} has been invalidated.`);

//          // Fetch permissions for the user's role
//          const roleRepository = AppDataSource.getRepository(UserRoleLookup);
//          const userRole = await roleRepository.findOne({
//              where: { rolename: authenticatedUser.role.rolename },
//              relations: ['permissions'] // IMPORTANT: Load the permissions relation
//          });
 
//          if (!userRole) {
//              throw new Error(`Role '${authenticatedUser.role.rolename}' not found for user ${authenticatedUser.userName}. Cannot generate tokens.`);
//          }
 
//          // Extract permission names
//          const userPermissions = userRole.permissions ? userRole.permissions.map(p => p.permissionName) : [];
 
//         const payload: JwtPayload = {
//             userName: authenticatedUser.userName,
//             role: authenticatedUser.role,
//             userId: authenticatedUser.id,
//             // added confirm it
//             tenantId:authenticatedUser.tenantId,
//             permissions:userPermissions
//         };

//         const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime; // Use accessTokenLifetime
//         const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime; // Use refreshTokenLifetime

//         console.log('Current Access Token Lifetime:', currentAccessTokenLifetime, 'seconds');
//         console.log('Current Refresh Token Lifetime:', currentRefreshTokenLifetime, 'seconds');

//         const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime }); //repeated  expiresIn: currentAccessTokenLifetime in response

//         const refreshTokenString = uuidv4();
//         const expiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

//         const newRefreshToken = new RefreshToken();
//         newRefreshToken.token = refreshTokenString;
//         newRefreshToken.userId = authenticatedUser.id;
//         newRefreshToken.expiresAt = expiresAt;
//         newRefreshToken.deviceInfo = deviceInfo;

//         //New refresh token saved to DB for user ${authenticatedUser.userName} (${deviceInfo}): ${refreshTokenString}`);
//         await refreshTokenRepo.save(newRefreshToken);
         

//         return {
//             access_token: accessToken,
//             refresh_token: refreshTokenString,
//             role: authenticatedUser.role,
//             userId: authenticatedUser.id,
//             AccessToken_expiresIn: currentAccessTokenLifetime
//         };
//     } catch (error: any) {
//         console.error('Error during Login:', error.message || error);
//         throw error;
//     }
// };

// --- MODIFIED Login function ---
const Login = async (credentials: { userName: string; password: string; }, deviceInfo: string): Promise<LoginResponse> => {
    // Get instances from the dependency getters
    const userService = getUserRepository(); // Use the UserService instance
    const refreshTokenRepo = getRefreshTokenRepository();
    const settingsService = getSettingsServiceRepository();
    const userTenantContextRepo = AppDataSource.getRepository(UserTenantContext); // Get UserTenantContext repository

    try {
        console.log('Attempting login for userName:', credentials.password);
        
        // 1. Authenticate the global User
        const authenticatedUser = await userService.Authenticate(credentials.userName, credentials.password);
        if (!authenticatedUser) {
            throw new Error('Invalid credentials');
        }

        if (typeof authenticatedUser.id === 'undefined') {
            throw new Error('Authenticated user missing ID.');
        }

        // 2. Invalidate any existing refresh token for this user on this device
        await refreshTokenRepo.deleteExistingTokenForDevice(authenticatedUser.id, deviceInfo);
        console.log(`Any previous refresh token for user ${authenticatedUser.userName} on device ${deviceInfo} has been invalidated.`);

        // 3. Fetch all active UserTenantContexts for this authenticated User
        // Eager load role and its permissions, and tenant for display name
        const userContexts = await userTenantContextRepo.find({
            where: { userId: authenticatedUser.id, isActiveInContext: true },
            relations: ['tenant', 'role', 'role.permissions'] // Load tenant, role, and role's permissions
        });

        if (userContexts.length === 0) {
            throw new Error(`No active contexts found for user ${authenticatedUser.userName}. Please contact support.`);
        }

        // 4. Map UserTenantContexts to AvailableContext DTOs
        const availableContexts: AvailableContext[] = userContexts.map(context => ({
            userId:context.userId,//added
            tenantId: context.tenantId,
            tenantName: context.tenant.tenantName, // Assuming tenant name is available on the loaded tenant object
            roleName: context.roleName,
            permissions: context.role.permissions ? context.role.permissions.map(p => p.permissionName) : []
        }));

        // 5. Create JWT Payload
        const payload: JwtPayload = {
            userName: authenticatedUser.userName,
            userId: authenticatedUser.id,
            availableContexts: availableContexts // Include all contexts in the initial token
        };

        const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime;
        const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime;

        console.log('Current Access Token Lifetime:', currentAccessTokenLifetime, 'seconds');
        console.log('Current Refresh Token Lifetime:', currentRefreshTokenLifetime, 'seconds');

        // 6. Generate Access Token
        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

        // 7. Generate and Save Refresh Token
        const refreshTokenString = uuidv4();
        const expiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);


        const newRefreshToken = new RefreshToken();
        newRefreshToken.token = refreshTokenString;
        newRefreshToken.userId = authenticatedUser.id;
        newRefreshToken.expiresAt = expiresAt;
        newRefreshToken.deviceInfo = deviceInfo;

        await refreshTokenRepo.save(newRefreshToken);
        
        console.log(`Login successful for user ${authenticatedUser.userName}. Generated access and refresh tokens.`);


        // 8. Return the response
        return {
            access_token: accessToken,
            refresh_token: refreshTokenString,
            userId: authenticatedUser.id,
            availableContexts: availableContexts, // Return the contexts to the frontend
            expires_in : currentAccessTokenLifetime //earlier was AccessToken_expiresIn
            ,tenantId: availableContexts[0]!.tenantId,
          //  tenantName:  availableContexts![0].tenant.tenantName, // Make sure tenant relation is loaded
            tenantType: 'INSTITUTE',//availableContexts![0].t.tenant.tenantTypeName, //pending- hardcoded
            roleName: 'Coordinator'// availableContexts![0]!.roleName, //pending-hardcode
        };

    } catch (error: any) {
        console.error('Error during Login:', error.message || error);
        throw error;
    }
}

// --- RefreshAccessToken function ---//changed enum to lookup
// const RefreshAccessToken = async (refreshToken: string, userId: number): Promise<{ accessToken: string; newRefreshToken?: string; role: UserRoleLookup; userId: number }> => 
// {
//     const userRepo = getUserRepository();
//     const refreshTokenRepo = getRefreshTokenRepository();
//     const settingsService = getSettingsServiceRepository();

//     try {
//         const storedToken = await refreshTokenRepo.findByToken(refreshToken);

//         if (!storedToken || storedToken.userId !== userId) {
//             throw new Error('Invalid or unauthorized refresh token.');
//         }

//         if (new Date() > storedToken.expiresAt) {
//             await refreshTokenRepo.deleteByToken(refreshToken);
//             throw new Error('Refresh token expired.');
//         }

//         await refreshTokenRepo.deleteByToken(refreshToken); // Invalidate the old refresh token

//         const user = await userRepo.getById(userId);
//         if (!user) {
//             throw new Error('User associated with refresh token not found.');
//         }
//  // Fetch permissions for the user's role
//  const roleRepository = AppDataSource.getRepository(UserRoleLookup);
//  const userRole = await roleRepository.findOne({
//      where: { rolename: user.role.rolename },
//      relations: ['permissions'] // IMPORTANT: Load the permissions relation
//  });

//  if (!userRole) {
//      throw new Error(`Role '${user.role.rolename}' not found for user ${user.userName}. Cannot generate tokens.`);
//  }

//  // Extract permission names
//  const userPermissions = userRole.permissions ? userRole.permissions.map(p => p.permissionName) : [];

//         const payload: JwtPayload = {
//             userName: user.userName,
//          //   role: user.role,
//             userId: user.id,
//             //added confirm it
//           //  tenantId:user.tenantId,
//             permissions:userPermissions
//         };

//         const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime;
//         const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

//         const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime;
//         const newRefreshTokenString = uuidv4();
//         const newExpiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

//         const newRefreshToken = new RefreshToken();
//         newRefreshToken.token = newRefreshTokenString;
//         newRefreshToken.userId = user.id;
//         newRefreshToken.expiresAt = newExpiresAt;
//         newRefreshToken.deviceInfo = storedToken.deviceInfo;
//         await refreshTokenRepo.save(newRefreshToken);

//         return {
//             accessToken: accessToken,
//             newRefreshToken: newRefreshTokenString,
//             role: user.role,
//             userId: user.id
//         };

//     } catch (error: any) {
//         console.error('Error refreshing access token:', error.message || error);
//         throw error;
//     }
// };


// --- MODIFIED RefreshAccessToken function ---
// Assumes tenantId and roleName are extracted from the *expired* access token or explicitly provided by the client.
const RefreshAccessToken = async (
    refreshToken: string,
    userId: number,
    tenantId: string, // REQUIRED: The tenant ID of the context to refresh
    roleName: string // REQUIRED: The role name of the context to refresh
): Promise<RefreshAccessTokenResponse> => {
    const userService = getUserRepository();
    const refreshTokenRepo = getRefreshTokenRepository();
    const settingsService = getSettingsServiceRepository();
    const userTenantContextRepo = AppDataSource.getRepository(UserTenantContext);

    try {
        // 1. Validate the Refresh Token
        const storedToken = await refreshTokenRepo.findByToken(refreshToken);

        if (!storedToken || storedToken.userId !== userId) {
            throw new Error('Invalid or unauthorized refresh token.');
        }

        if (new Date() > storedToken.expiresAt) {
            await refreshTokenRepo.deleteByToken(refreshToken);
            throw new Error('Refresh token expired.');
        }

        // 2. Invalidate the old refresh token
        await refreshTokenRepo.deleteByToken(refreshToken);

        // 3. Get the global User
        const user = await userService.getUserById(userId);
        if (!user) {
            throw new Error('User associated with refresh token not found.');
        }

        // 4. Fetch the specific UserTenantContext for the requested tenantId and roleName
        const userContext = await userTenantContextRepo.findOne({
            where: {
                userId: userId,
                tenantId: tenantId,
                roleName: roleName,
                isActiveInContext: true // Ensure the context is active
            },
            relations: ['role', 'role.permissions'] // Load role and its permissions
        });

        if (!userContext || !userContext.role) {
            throw new Error(`Invalid or inactive context requested for refresh: Tenant ${tenantId}, Role ${roleName}.`);
        }

        // 5. Extract permission names for the selected context
        const userPermissions = userContext.role.permissions ? userContext.role.permissions.map(p => p.permissionName) : [];

        // 6. Create JWT Payload for the context-specific access token
        const payload: ContextSpecificJwtPayload = {
            userName: user.userName,
            userId: user.id,
            tenantId: userContext.tenantId, // Use the tenantId from the found context
            roleName: userContext.roleName, // Use the roleName from the found context
            permissions: userPermissions
        };

        const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime;
        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

        // 7. Generate and Save a new Refresh Token (optional, but good practice for rotation)
        const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime;
        const newRefreshTokenString = uuidv4();
        const newExpiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

        const newRefreshToken = new RefreshToken();
        newRefreshToken.token = newRefreshTokenString;
        newRefreshToken.userId = user.id;
        newRefreshToken.expiresAt = newExpiresAt;
        newRefreshToken.deviceInfo = storedToken.deviceInfo; // Keep same device info
        await refreshTokenRepo.save(newRefreshToken);

        // 8. Return the response
        return {
            access_token: accessToken,
            newRefreshToken: newRefreshTokenString,
            userId: user.id,
            tenantId: userContext.tenantId,
            roleName: userContext.roleName,
            permissions: userPermissions,
            AccessToken_expiresIn: currentAccessTokenLifetime
        };

    } catch (error: any) {
        console.error('Error refreshing access token:', error.message || error);
        throw error;
    }
};
// --- Logout function ---
const Logout = async (refreshTokenData: { refreshToken: string }): Promise<void> => {
    console.log('loggigng out........before that trying to delete');
    
    const refreshTokenRepo = getRefreshTokenRepository();
    try {
        await refreshTokenRepo.deleteByToken(refreshTokenData.refreshToken);
        console.log('Refresh token deleted from DB:', refreshTokenData.refreshToken);
    } catch (error: any) {
        console.error('Error during logout:', error.message || error);
        throw new Error('Error during logout: ' + error.message);
    }
};

// --- Google Login Function ---
// const LoginWithGoogle = async (code: string, deviceInfo: string): Promise<{ access_token: string; refresh_token: string; role: string; userId: number }> => {
//     const userRepo = getUserRepository();
//     const refreshTokenRepo = getRefreshTokenRepository();
//     const settingsService = getSettingsService();

//     try {
//         console.log('Exchanging Google authorization code for tokens...');
//         const { tokens } = await googleOAuthClient.getToken(code);
//         console.log('Google tokens received (partial):', tokens.access_token ? 'Received' : 'Not received', tokens.id_token ? 'Received' : 'Not received');


//         if (!tokens.id_token) {
//             throw new Error('Google ID token not received.');
//         }

//         const payload = googleOAuthClient.decodeIdToken(tokens.id_token); // Decode without full verification for quick check
//         console.log('Decoded Google ID Token Payload:', payload);


//         // Verify the ID Token with full verification (audience, expiration, signature)
//         const ticket = await googleOAuthClient.verifyIdToken({
//             idToken: tokens.id_token,
//             audience: GOOGLE_CLIENT_ID,
//         });
//         const verifiedPayload = ticket.getPayload();
//         if (!verifiedPayload) {
//             throw new Error('Could not get verified payload from Google ID token.');
//         }

//         const googleId = verifiedPayload.sub;
//         const email = verifiedPayload.email;
//         const name = verifiedPayload.name || email;

//         if (!googleId || !email) {
//             throw new Error('Missing Google user ID or email in payload.');
//         }

//         console.log(`Google authenticated user: ID=${googleId}, Email=${email}, Name=${name}`);

//         let user = await userRepo.findByGoogleId(googleId);

//         if (!user) {
//             user = await userRepo.findByEmail(email);
//             if (user) {
//                 console.log(`Existing user found with email ${email}. Linking Google ID.`);
//                 user.googleId = googleId;
//                 if (!user.isEmailVerified) user.isEmailVerified = true;
//                 await userRepo.save(user);
//             } else {
//                 console.log(`Creating new user for Google ID ${googleId} and email ${email}.`);
//                 user = await userRepo.createGoogleUser(googleId, email, name);
//             }
//         }

//         if (typeof user.id === 'undefined') {
//             throw new Error('Authenticated user missing ID.');
//         }

//         console.log(`Checking for existing session for user ${user.userName} on device: ${deviceInfo}`);
//         await refreshTokenRepo.deleteExistingTokenForDevice(user.id, deviceInfo);
//         console.log(`Any previous refresh token for user ${user.userName} on device ${deviceInfo} has been invalidated.`);

//         const appPayload: JwtPayload = {
//             userName: user.userName,
//             Role: user.Role,
//             userId: user.id
//         };

//         const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetime;
//         const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetime;

//         const accessToken = jwt.sign(appPayload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

//         const refreshTokenString = uuidv4();
//         const expiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

//         const newRefreshToken = new RefreshToken();
//         newRefreshToken.token = refreshTokenString;
//         newRefreshToken.userId = user.id;
//         newRefreshToken.expiresAt = expiresAt;
//         newRefreshToken.deviceInfo = deviceInfo;

//         await refreshTokenRepo.save(newRefreshToken);
//         console.log(`New refresh token saved to DB for user ${user.userName} (${deviceInfo}): ${refreshTokenString}`);

//         return {
//             access_token: accessToken,
//             refresh_token: refreshTokenString,
//             role: user.role,
//             userId: user.id
//         };

//     } catch (error: any) {
//         console.error('Error during Google Login:', error.message || error);
//         throw error;
//     }
// };

export {  generateAuthTokens, Login, Logout, RefreshAccessToken }; //, LoginWithGoogle