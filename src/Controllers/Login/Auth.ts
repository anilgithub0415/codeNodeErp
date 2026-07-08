import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
require('dotenv').config();

// 💡 1. Extend Express types so compiler knows exactly what exists on req.user and req.id
// 💡 Fix: Safely append properties to the existing Express Request type
declare global {
  namespace Express {
    interface Request {
      user: any & {
        id: number;
        siteId: number;
        clientId: number;
        tenantId: number;
      };
      id?: {
        username: string;
      };
    }
  }
}


export const auth = (req: Request, res: Response, next: NextFunction) => {
    
    // 💡 2. FIXED SECURITY HOLE: Removed the broad `includes('/api')` check.
    // Explicitly check ONLY your true public endpoints.
    if (
      //Note:
      // to allow with invalid pasword inside userservice : if (!!isPasswordValid) { retrun null } return user
      
      // if u will forgive here by request for contains '/api', u will not get req.user while saving
      //(req.originalUrl.includes('/api/') )||
        (req.originalUrl === '/api/login' && req.method === 'POST') ||
        (req.originalUrl === '/api/signup' && req.method === 'POST') ||
        (req.originalUrl.includes('/api/Device/') && req.method === 'GET')
    ) {
        return next();
    }

    const authHeader = req.header('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access Denied: No token provided or invalid format.' });
    }

    const token = authHeader.split(' ')[1];
    const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'aaa';

    try {
        const verified = jwt.verify(token, ACCESS_TOKEN_SECRET) as any;
        
        // 💡 3. Hydrate all structural context into req.user directly from JWT payload
        req.user = { 
            id: verified.userId, 
            siteId: verified.siteId,
            clientId: verified.clientId, // 👈 Extracted safely from token
            tenantId: verified.tenantId   // 👈 Extracted safely from token
        }; 

        req.id = { username: verified.username };

        next();
    } catch (error) {
        console.log('JWT Verification Failed:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};
