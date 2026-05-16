import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
require('dotenv').config();

/**
 * A JWT authentication middleware for protected routes.
 * TypeScript now recognizes 'req.id' because of the express.d.ts declaration.
 */
export const auth = (req: Request, res: Response, next: NextFunction) => {
  
  
    // Whitelist public routes that do not require authentication.
    if (
        
        //to bypass Auth security we can uncomment to allow direct access but we loose security
        (req.originalUrl.includes('/api')) || //to allow all, uncomment it for security

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


    const secret = ACCESS_TOKEN_SECRET; // IMPORTANT: Use an environment variable here.

    try {
        const verified = jwt.verify(token, secret);
        //for createdbyuserid
        req.user = { id: (verified as any).userId }; //Here we are storing userId in req.user.id 
        


        req.id = { username: (verified as any).username };
        next();
    } catch (error) {
        console.log('ts says Invalid Token', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};