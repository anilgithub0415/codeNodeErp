// src/data-source.ts
import 'reflect-metadata'; // Required for TypeORM decorators
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/entity/User'; // Import your User entity
import {Settings} from './src/entity/Settings'
import {Config} from './src/entity/Config'
import {  Config_AppName } from './src/entity/Config_Appname';

import {RefreshToken} from './src/entity/RefreshToken'
import { refreshTokens } from './src/memory/memoryStore';
import { SubscriptionPlanLookup} from './src/entity/SubscriptionPlanLookup';
import { UserRoleLookup } from './src/entity/UserRoleLookup';
//import { RolePermission } from './src/entity/RolePermission';
import { Permission } from './src/entity/Permission';








import { Option } from './src/entity/Option';




import { AutocodeCounter } from './src/entity/AutocodeCounter';
import { UserTenantContext } from './src/entity/UserTenantContext';
import { Tenant } from './src/entity/Tenant';
import { TenantTypeLookup } from './src/entity/TenantTypeLookup';
import { Product } from './src/entity/Product';
import { product_table_fields } from './src/entity/product_table_fields';
import { User_table_fields } from './src/entity/user_table_fields';
import { TenantStrategy } from './src/entity/TenantStrategy';
import { Customer } from './src/entity/Customer';
import { Tenant_custom_scripts } from './src/entity/Tenant_custom_scripts';
import { product_table_fields_tenantwise } from './src/entity/product_table_fields_tenantwise';
import { TenantFormConfigs } from './src/entity/TenantFormConfigs'
import { PurchaseOrder } from './src/entity/PurchaseOrder';
import { PurchaseOrderItem } from './src/entity/PurchaseOrderItem';
import { Vendor } from './src/entity/Vendor';



// Load environment variables (ensure this runs at application startup)
dotenv.config();

// Define your TypeORM DataSource configuration
// This replaces your previous dbConfig/dbConfigGearHost
export const AppDataSource = new DataSource({
    type: 'mssql', // Specifies SQL Server
    host: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10), // Default SQL Server port
    username: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'saadmin',
    database: process.env.DB_DATABASE || 'test',
      
    // Set to true to automatically create database schema on sync (development only)
    // For production, use migrations (TypeORM generates these)
    //synchronize: false, // Set to true for initial development to auto-create tables, then set to false and use migrations
    synchronize: true,
    logging: false, // Set to true to see SQL queries in console  RolePermission,
  //logging:['query','error'],
   
    entities: [User,UserRoleLookup,Permission,RefreshToken,Settings,Config,Config_AppName,Tenant,TenantTypeLookup,SubscriptionPlanLookup
    ,Option,UserTenantContext  
    ,Product,product_table_fields, Product,product_table_fields_tenantwise,
    User_table_fields, TenantStrategy, Customer, Vendor
    ,Tenant_custom_scripts, TenantFormConfigs
    ,PurchaseOrder,PurchaseOrderItem
,AutocodeCounter ], // Register your entities here
    //Tenant,TenantTypeLookup,SubscriptionPlanLookup,User,UserRoleLookup,RolePermission,Permission,RefreshToken,Settings
    
    
    migrations: [], // You'll add migration files here later
    subscribers: [],     

    // Options specific to mssql driver
    extra: {
        // trustServerCertificate: true, // For development on local SQL Express
        // encrypt: true, // For Azure SQL Database
    },
    // Dynamically set based on environment variables for clarity
    options: {
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        encrypt: process.env.DB_ENCRYPT === 'true',
    }
});
  
// Initialize the data source when your application starts
// You might call this in your main app.ts or server.ts
/*
AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });
*/ 