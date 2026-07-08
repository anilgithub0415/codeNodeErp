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

//sanitize middleware for removing zero id from req.body
// Write the function inline to completely avoid import loops
app.use((req, res, next) => {
    if (req.body && req.body.id === 0) {
        delete req.body.id; 
    }
    next();
});

import lookupsC from './src/Controllers/lookups/lookups';
app.use('/api/lookups', lookupsC);

import configC from './src/Controllers/Config/Config';
app.use('/api/config', configC);

import settingsC from './src/Controllers/Settings/Settings';
app.use('/api/admin-settings', settingsC); // Consistent mounting example

import formschemasC from './src/Controllers/form-schemas/form-schemas';
app.use('/api/form-schemas', formschemasC);

// Login Controller - now accessible at /api/login and /api/login/auth/google/callback
import loginC from './src/Controllers/Login/Login'; // Use default import
app.use('/api/login', loginC); // Mounts login routes under /api/login


import userC from './src/Controllers/User/User';
app.use('/api/user', userC);



import tenantC from './src/Controllers/Tenant/Tenant';
app.use('/api/tenant', tenantC);


import productC from './src/Controllers/Product/Product';
app.use('/api/product', productC);
 

import hsnC from './src/Controllers/HSNTaxRule/HSNTaxRule';
app.use('/api/hsntaxrule', hsnC);

import vendorC from './src/Controllers/Vendor/Vendor';
app.use('/api/vendor', vendorC);

import cityC from './src/Controllers/City/City';
app.use('/api/city', cityC);

import districtC from './src/Controllers/District/District';
app.use('/api/district', districtC);

import customerC from './src/Controllers/Customer/Customer';
app.use('/api/customer', customerC);
 
import siteC from './src/Controllers/Site/Site';
app.use('/api/site', siteC);
 

import formC from './src/Controllers/TenanttForm/TenantForm';
app.use('/api/form', formC);


import purchaseC from './src/Controllers/Purchase/Purchase';
app.use('/api/purchase', purchaseC);
 
import clientPurchaseC from './src/Controllers/ClientPurchase/ClientPurchase'
app.use('/api/clientPurchase', clientPurchaseC);
 
import salesC from './src/Controllers/Sales/Sales';
app.use('/api/sales', salesC);

import uomconversionC from './src/Controllers/uomconversion/uomconversion';
app.use('/api/uom-conversion', uomconversionC);


import delichallC from './src/Controllers/DeliveryChallan/DeliveryChallan';
app.use('/api/delichall',delichallC)


import userprefC from './src/Controllers/user_preferences/user_preferences';
app.use('/api/user_preferences',userprefC)

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