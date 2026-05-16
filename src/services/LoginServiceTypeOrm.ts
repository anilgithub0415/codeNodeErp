// // src/services/LoginService.ts
// import jwt from 'jsonwebtoken';
// import { v4 as uuidv4 } from 'uuid';
// //import { refreshTokens } from '../memory/memoryStore'; // Use a database for refresh tokens in production.

// import { RefreshToken } from '../entity/RefreshToken'; // <-- NEW: Import RefreshToken entity

// import UserRepository from '../Repositories/UserRepositoryTypeorm'; // Use import for the class
// import { AppDataSource } from '../../data-source'; // Need to ensure DataSource is initialized
// import{ settingsService} from './SettingsService'
// import RefreshTokenRepositoryTypeorm from '../Repositories/RefreshTokenRepositoryTypeorm';

// // Make sure dotenv is configured early in your application's entry point (e.g., app.ts/server.ts)
// // If LoginService is loaded via another file that already has dotenv.config(), you can remove this line.
// // Otherwise, it's safer to ensure it here if LoginService is a primary entry.
// // require('dotenv').config(); // Remove this CommonJS line


// const ACCESS_TOKEN_LIFETIME = process.env.ACCESS_TOKEN_LIFETIME || '3600s'; // 1 Hour
// const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key';
// const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';

// interface JwtPayload {
//     UserName: string;
//     Role: string;
//     exp?: number;
//     // Potentially add userId to payload if you want it in JWT
//     userId?: number;
// }

// // 1. Declare UserRepo as a private class member or pass it via constructor/factory
// // This way, its instantiation can be controlled after DB init.
// // For now, let's make it a late-initialized variable.
// let userRepoInstance: UserRepository;
// let refreshTokenRepoInstance: RefreshTokenRepositoryTypeorm;

// /**
//  * Initializes the database connection and the UserRepository.
//  * This function should be called once at your application's startup.
//  */
// export async function initializeLoginService(): Promise<void> {
//     if (!AppDataSource.isInitialized) {
//         try {
//             await AppDataSource.initialize();
//             console.log("Data Source has been initialized!");
//         } catch (err) {
//             console.error("Error during Data Source initialization:", err);
//             process.exit(1); // Exit if DB connection fails, as this is critical
//         }
//     }
    
//     try {
//         await settingsService.init();
//         // --- NEW: Ensure default settings are present and loaded ---
//         await settingsService.ensureDefaultSettings();
//         console.log("Application settings ensured and loaded.");
//         // --- END NEW ---
//     } catch (error) {
//         console.error("Failed to load or create initial settings:", error);
//         process.exit(1); // Exit if settings cannot be loaded/created
//     }
    
//      // Load settings during application startup
//      try {
//         await settingsService.loadSettings();
//     } catch (error) {
//         console.error("Failed to load initial settings:", error);
//         process.exit(1); // Critical: exit if settings cannot be loaded
//     }
//     // Instantiate UserRepository ONLY after AppDataSource is initialized
//     userRepoInstance = new UserRepository();
//     refreshTokenRepoInstance = new RefreshTokenRepositoryTypeorm(); // <-- NEW: Instantiate refresh token repository
//     console.log("UserRepository and RefreshTokenRepository instances created.");

//     console.log("UserRepository instance created.");
// }



// const Login = async (credentials: any) => {
//     if (!userRepoInstance || !refreshTokenRepoInstance) { // Check both repos
//         console.error("LoginService not initialized. Call initializeLoginService() first.");
//         throw new Error('Server not ready: Login service not initialized.');
//     }

//     if (!credentials || !credentials.UserName || !credentials.password) {
//         throw new Error('Missing UserName or password');
//     }
   
//     try {
//         console.log('credentials.UserName:', credentials.UserName);
//         const authenticatedUser = await userRepoInstance.Authenticate(credentials.UserName, credentials.password);
//         if (!authenticatedUser) {
//             throw new Error('Invalid credentials');
//         }

//         // Ensure authenticatedUser has an 'id' which is crucial for linking refresh tokens
//         if (typeof authenticatedUser.id === 'undefined') {
//             throw new Error('Authenticated user missing ID.');
//         }
//         if (!authenticatedUser.isEmailVerified) { throw new Error('Please verify your email address first.'); }
//         const payload: JwtPayload = {
//             UserName: authenticatedUser.UserName,
//             Role: authenticatedUser.Role,
//             userId: authenticatedUser.id // Include userId in JWT payload for convenience
//         };

//         const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetimeSeconds;
//         const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetimeSeconds;

//         console.log('Current Access Token Lifetime:', currentAccessTokenLifetime, 'seconds');
//         console.log('Current Refresh Token Lifetime:', currentRefreshTokenLifetime, 'seconds');

//         const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

//         // --- NEW: Generate and store RefreshToken in DB ---
//         const refreshTokenString = uuidv4(); // The UUID string itself
//         const expiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000); // Calculate expiry date

//         const newRefreshToken = new RefreshToken();
//         newRefreshToken.token = refreshTokenString;
//         newRefreshToken.userId = authenticatedUser.id;
//         newRefreshToken.expiresAt = expiresAt;
//         newRefreshToken.deviceInfo = 'Web Browser'; // You could get this from request headers (e.g., User-Agent)

//         await refreshTokenRepoInstance.save(newRefreshToken); // Save to DB
//         console.log(`New refresh token saved to DB for user ${authenticatedUser.UserName}: ${refreshTokenString}`);
//         // --- END NEW ---

//         return {
//             access_token: accessToken,
//             refresh_token: refreshTokenString, // Send the UUID string back
//             Role: authenticatedUser.Role,
//             userId: authenticatedUser.id // Return userId to client if helpful
//         };
//     } catch (error: any) {
//         console.error('Error during Login:', error.message || error);
//         throw error;
//     }
// };


// // --- NEW: Function to verify refresh token and issue new access token ---
//  const RefreshAccessToken = async (refreshToken: string, userId: number): Promise<{ accessToken: string; newRefreshToken?: string; role: string; userId: number }> => {
//     if (!refreshTokenRepoInstance || !userRepoInstance) {
//         throw new Error('Service not initialized.');
//     }

//     if (!refreshToken || !userId) {
//         throw new Error('Refresh token and User ID are required.');
//     }

//     try {
//         // 1. Find the refresh token in the database
//         const storedToken = await refreshTokenRepoInstance.findByToken(refreshToken);

//         if (!storedToken || storedToken.userId !== userId) {
//             throw new Error('Invalid or unauthorized refresh token.');
//         }

//         // 2. Check if the refresh token is expired
//         if (new Date() > storedToken.expiresAt) {
//             // Optional: Delete the expired token from DB
//             await refreshTokenRepoInstance.deleteByToken(refreshToken);
//             throw new Error('Refresh token expired.');
//         }

//         // 3. (Optional but recommended): Invalidate the old refresh token
//         // This enhances security by preventing replay attacks
//         await refreshTokenRepoInstance.deleteByToken(refreshToken);

//         // 4. Issue a new Access Token
//         const user = await userRepoInstance.getById(userId);
//         if (!user) {
//             throw new Error('User associated with refresh token not found.');
//         }

//         const payload: JwtPayload = {
//             UserName: user.UserName,
//             Role: user.Role,
//             userId: user.id
//         };

//         const currentAccessTokenLifetime = settingsService.getSettings().accessTokenLifetimeSeconds;
//         const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: currentAccessTokenLifetime });

//         // 5. (Optional): Issue a new Refresh Token (rotating refresh tokens for enhanced security)
//         const currentRefreshTokenLifetime = settingsService.getSettings().refreshTokenLifetimeSeconds;
//         const newRefreshTokenString = uuidv4();
//         const newExpiresAt = new Date(Date.now() + currentRefreshTokenLifetime * 1000);

//         const newRefreshToken = new RefreshToken();
//         newRefreshToken.token = newRefreshTokenString;
//         newRefreshToken.userId = user.id;
//         newRefreshToken.expiresAt = newExpiresAt;
//         newRefreshToken.deviceInfo = storedToken.deviceInfo; // Inherit device info
//         await refreshTokenRepoInstance.save(newRefreshToken);

//         return {
//             accessToken: accessToken,
//             newRefreshToken: newRefreshTokenString,
//             role: user.Role,
//             userId: user.id
//         };

//     } catch (error: any) {
//         console.error('Error refreshing access token:', error.message || error);
//         throw error;
//     }
// };
// // --- END NEW ---
// const Logout = async (refreshTokenData: { refreshToken: string }): Promise<void> => {
//     if (!refreshTokenRepoInstance) {
//         throw new Error('LoginService not initialized.');
//     }
//     if (!refreshTokenData || !refreshTokenData.refreshToken) {
//         throw new Error('Refresh token is required');
//     }
//     try {
//         // --- NEW: Delete refresh token from DB ---
//         await refreshTokenRepoInstance.deleteByToken(refreshTokenData.refreshToken);
//         console.log('Refresh token deleted from DB:', refreshTokenData.refreshToken);
//         // --- END NEW ---
//     } catch (error: any) {
//         console.error('Error during logout:', error.message || error);
//         throw new Error('Error during logout: ' + error.message);
//     }
// };

// export { Login, Logout, RefreshAccessToken };
