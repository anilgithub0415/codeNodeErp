

//Token_dbOps code below

import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {refreshTokens} from '../../memory/memoryStore'

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
 
export const refreshtoken = async (req: Request, res: Response) => {

    console.log(('method:refreshtoken'));
    
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ 'error': 'Refreshtoken not provided' });
    }

    try {
       
        
        // Check if the refresh token exists in our in-memory store
        const refreshTokenData = refreshTokens[refreshToken];
        
        console.log('at refresh refreshToken:',refreshToken,'  ,refreshTokenData:',refreshTokens[refreshToken]);

        if (!refreshTokenData) {
            return res.status(403).json({ 'error': 'Invalid refresh token' });
        }

        const UserName = refreshTokenData.UserName;

        // Generate a new access token
        const newAccessTokenPayload: JwtPayloadWithUsername = { UserName: UserName, username: 'user-from-refresh' }; // You might need to fetch actual username
        //*.+
        const newAccessToken = jwt.sign(newAccessTokenPayload, ACCESS_TOKEN_SECRET, { expiresIn: parseInt(ACCESS_TOKEN_LIFETIME) });

        // Generate a new refresh token (optional, for rotation)
        //*.+ i think dynamic UserName must be considered
        const newRefreshToken = uuidv4();
        refreshTokens[newRefreshToken] = { UserName: UserName };
        delete refreshTokens[refreshToken]; // Invalidate the old refresh token

        res.status(201).json({
            message: 'Token refreshed successfully',
            access_token: newAccessToken,
            token_type: 'Bearer',
            expires_in: 100,
            refresh_token: newRefreshToken, // Send the new refresh token back
        });
    } catch (error: any) {
        console.error('Error during refresh token:', error);
        return res.status(500).json({ 'error': 'Internal server error during refresh' }); // More generic error for unexpected issues
    }
};