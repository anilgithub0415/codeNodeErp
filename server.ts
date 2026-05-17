// server.ts
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser'; // body-parser is included in express.json/urlencoded
import { initializeDependencies } from './src/dependencies'; // Import the central initializer
import {auth}  from './src/Controllers/Login/Auth'; // Correct import for your auth middleware 

// Load environment variables as early as possible
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies
app.use(cors()); // Enables CORS for all routes
app.set('trust proxy', true); // Trust the X-Forwarded-For header from proxies (e.g., Load Balancers)
//for auth.ts
// JWT Authentication Middleware
// This will apply the `auth` middleware to all incoming requests,
// except for the paths you've explicitly whitelisted inside the middleware itself.

//JWT here------------------------------------------------------------------
//apply auth for all accept login
/*
app.use("*", function(req,res,next){
    auth(req,res,next);
});*/ 

app.use(auth)
//end JWT section------------------------------------------------------------

// Note: Cache and checkCache imports are here but not used in the provided code snippet
// Assuming they will be used later as middleware or utilities.
const cache = require('./src/Special/cachemanager');
const checkCache = require('./src/Middlewares/checkCache');

// Import Controllers (using dynamic import for consistency)
// The '/api' prefix needs to be handled consistently for all routes.
// Given your previous discussion, '/api' should be the primary prefix for all API endpoints.
 
// Login Controller - now accessible at /api/login and /api/login/auth/google/callback
import loginC from './src/Controllers/Login/Login'; // Use default import
app.use('/api/login', loginC); // Mounts login routes under /api/login

// // You had these before, ensure their paths are correct relative to '/api' prefix
// import tokenC from './src/Controllers/Token/Token';
// app.use('/api/token', tokenC); // Mounts token routes under /api/token



import userC from './src/Controllers/User/User';
app.use('/api/user', userC);



import tenantC from './src/Controllers/Tenant/Tenant';
app.use('/api/tenant', tenantC);



import settingsC from './src/Controllers/Settings/Settings';
app.use('/api/admin-settings', settingsC); // Consistent mounting example

//
import formschemasC from './src/Controllers/form-schemas/form-schemas';
app.use('/api/form-schemas', formschemasC);

import lookupsC from './src/Controllers/lookups/lookups';
app.use('/api/lookups', lookupsC);

// 

// Centralized error handling middleware (best practice)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err.stack || err.message);
    res.status(500).send('Something went wrong!'); 
});
    
    
/**
 * Starts the Node.js Express server after all dependencies are initialized.
 */
async function startServer() {
    try {
        await initializeDependencies(); // Initialize all services and repositories first
        console.log("All application dependencies are ready.");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Access API at http://localhost:${PORT}/api`);
        });
    } catch (error) { 
        console.error("Failed to start server due to initialization error:", error);
        process.exit(1); // Critical: Exit if startup fails
    } 
}
 
startServer();