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

import settingsC from './src/Controllers/SecuritySettings/SecuritySettings';
app.use('/api/security-settings', settingsC); // Consistent mounting example

import formschemasC from './src/Controllers/form-schemas/form-schemas';
app.use('/api/form-schemas', formschemasC);

// Login Controller - now accessible at /api/login and /api/login/auth/google/callback
import loginC from './src/Controllers/Login/Login'; // Use default import
app.use('/api/login', loginC); // Mounts login routes under /api/login

//for SuperAdmin contextswitch
import loginswitchC from './src/Controllers/Login_Switchcontext/Login_Switchcontext'; // Use default import
app.use('/api/loginswitch', loginswitchC); // for SuperAdmin to switch context


import tokenC from './src/Controllers/Token/Token';
app.use('/api/token', tokenC); // Mounts token routes under /api/token

import userC from './src/Controllers/User/User';
app.use('/api/user', userC);



import tenantC from './src/Controllers/Tenant/TenantNew';
app.use('/api/tenant', tenantC);



import tenantTypeC from './src/Controllers/TenantType/TenantType';
app.use('/api/tenantType', tenantTypeC);

import tenantStartegyC from './src/Controllers/TenantStrategy/TenantStrategy';
app.use('/api/tenantStartegies', tenantStartegyC);





import productC from './src/Controllers/Product/Product';
app.use('/api/product', productC);
 
import productCategoryC from './src/Controllers/ProductCategory/ProductCategory';
app.use('/api/productCategory', productCategoryC);
 

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
app.use('/api/tenantform', formC);


import purchaseC from './src/Controllers/Purchase/Purchase';
app.use('/api/purchase', purchaseC);
 
import clientPurchaseC from './src/Controllers/ClientPurchase/ClientPurchase'
app.use('/api/clientPurchase', clientPurchaseC);
 
import clientRFQC from './src/Controllers/ClientRFQ/ClientRFQ'
app.use('/api/clientRFQ', clientRFQC);
 

import ClientSummaryCountOfOrdersC from './src/Controllers/ClientSummaryCountOfOrders/ClientSummaryCountOfOrders'
app.use('/api/ClientSummaryCountOfOrders', ClientSummaryCountOfOrdersC);

import salesC from './src/Controllers/Sales/Sales';
app.use('/api/sales', salesC);

import uomconversionC from './src/Controllers/uomconversion/uomconversion';
app.use('/api/uom-conversion', uomconversionC);


import delichallC from './src/Controllers/DeliveryChallan/DeliveryChallan';
app.use('/api/delichall',delichallC)

import clientRequirementC from './src/Controllers/ClientRequirement/ClientRequirement';
app.use('/api/clientRequirement',clientRequirementC)

import quotationC from './src/Controllers/Quotation/Quotation';
app.use('/api/quotation',quotationC)


import InteractionC from './src/Controllers/Interaction/Interaction';
app.use('/api/interaction',InteractionC)


//Discount announcing-------------------------------------------------------------------------------------------------------------
import lineDiscountC from './src/Controllers/lineDiscount/lineDiscount';
app.use('/api/lineDiscount',lineDiscountC)

import discountTypeC from './src/Controllers/DiscountType/DiscountType';
app.use('/api/discountType',discountTypeC)

//end Discount announcing---------------------------------------------------------------------------------------------------------

//global masters------------------------------------------------------------------------------------------------------------------

import hsnC from './src/Controllers/HSNTaxRule/HSNTaxRule';
app.use('/api/hsntaxrule', hsnC);

import leadsourceC from './src/Controllers/Leadsource/Leadsource';
app.use('/api/leadsource',leadsourceC)

import subscriptionC from './src/Controllers/Subscription/Subscription';
app.use('/api/subscriptionPlan',subscriptionC)

import userRolesC from './src/Controllers/userRoles/userRoles';
app.use('/api/roles',userRolesC)

import permissionC from './src/Controllers/Permissions/Permissions';
app.use('/api/permission',permissionC)

import rolePermissionC from './src/Controllers/RolePermission/RolePermission';
app.use('/api/rolePermission',rolePermissionC)

import dbStatusC from './src/Controllers/dbStatus/dbStatus';
app.use('/api/dbStatus',dbStatusC)

//End of global masters------------------------------------------------------------------------------------------------------------------


import userprefC from './src/Controllers/user_preferences/user_preferences';
app.use('/api/user_preferences',userprefC)

// Centralized error handling middleware (best practice)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err.stack || err.message);
    res.status(500).send('Something went wrong!'); 
});
    

//This is route for MigrateDatabaseFromCloud to Local
import migrateC from './CreateDbAtLocalAndMigrateFromcloud';
app.use('/api/migrate-database', migrateC);
//===================================================




// ==========================================
// 🔒 GLOBAL PROCESS DIAGNOSTICS
// ==========================================

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ CRITICAL: Unhandled Promise Rejection detected!');
    console.error('Location:', promise);
    console.error('Reason:', reason instanceof Error ? reason.stack : reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ CRITICAL: Uncaught Exception intercepted!');
    console.error(error.stack || error);
    process.exit(1); 
});

/**
 * Starts the Node.js Express server after all dependencies are initialized.
 */
/**
 * Starts the Node.js Express server with an explicit execution safety trigger
 */
async function startServer() {
    console.log("⏳ [Debug] Triggering startServer()...");
    
    // 💥 Create a 10-second safety cutoff to catch hidden database freezes
    const timeoutCutoff = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("CRITICAL TIMEOUT: initializeDependencies() froze for over 10 seconds!")), 60000)
    );

    try {
        console.log("⏳ [Debug] Launching initializeDependencies()...");
        
        // Race your initializer against the 10-second warning
        await Promise.race([initializeDependencies(), timeoutCutoff]);
        
        console.log("✅ [Debug] Success! Core dependencies loaded completely.");
        app.listen(PORT, () => {
            console.log(`🚀 Server successfully running on port ${PORT}`);
        });
    } catch (error: any) { 
        console.error("💥 [Debug] HANG INTERCEPTED SUCCESSFULLY:");
        console.error(error.stack || error.message || error); 
        process.exit(1); 
    } 
}

startServer();

