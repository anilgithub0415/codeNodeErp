// import jwt from 'jsonwebtoken';
// import { v4 as uuidv4 } from 'uuid';
// import { refreshTokens } from '../memory/memoryStore'; //  Use a database for refresh tokens in production.
// const UserRepository = require('../Repositories/UserRepository');

// require('dotenv').config();
// import { AppDataSource } from '../../data-source'; // Need to ensure DataSource is initialized


// const UserRepo = new UserRepository();
// const ACCESS_TOKEN_LIFETIME = process.env.ACCESS_TOKEN_LIFETIME || '3600s'; // 1 Hour
// const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key';
// const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';

// interface JwtPayload {
//     UserName: string;
//     Role: string;
//     exp?: number;
// }

// const Login = async (credentials: any) => {
//     if (!credentials || !credentials.UserName || !credentials.password) {
//         throw new Error('Missing UserName or password');
//     }
//     try {
//         console.log('credentials.UserName:',credentials.UserName);
//         const authenticatedUser = await UserRepo.Authenticate(credentials.UserName, credentials.password);
//         if (!authenticatedUser) {
//             throw new Error('Invalid credentials');
//         }
//         const payload: JwtPayload = {
//             UserName: authenticatedUser.UserName,  // Corrected to use UserId
//             Role: authenticatedUser.role,
//         };

//         console.log( '->',ACCESS_TOKEN_LIFETIME);
        
//         const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: parseInt(ACCESS_TOKEN_LIFETIME) });
//         const refreshToken = uuidv4();
//         refreshTokens[refreshToken] = { UserName: payload.UserName }; // Store in DB in production
//         console.log('refreshToken:', refreshToken, 'refreshTokens:', refreshTokens);
//         return {
//             access_token: accessToken,
//             refresh_token: refreshToken,
//             role: authenticatedUser.role,
//         };
//     } catch (error: any) {
//         throw error; // Re-throw for controller
//     }
// };

// const Logout = async (refreshToken: any) => {
//     if (!refreshToken || !refreshToken.refreshToken) {
//         throw new Error('Refresh token is required');
//     }
//     try {
//         if (refreshTokens[refreshToken.refreshToken]) {
//             delete refreshTokens[refreshToken.refreshToken];
//             console.log('Refresh token deleted:', refreshToken);
//         } else {
//             console.log('Refresh token not found:', refreshToken);
//         }
//     } catch (error: any) {
//         throw new Error('Error during logout: ' + error.message);
//     }
// };

// module.exports = { Login, Logout };