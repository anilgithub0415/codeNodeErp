// src/data-source.ts
import 'reflect-metadata'; // Required for TypeORM decorators
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/entity/User'; // Import your User entity
import {SecuritySettings} from './src/entity/SecuritySettings'
import {Config} from './src/entity/Config'
import {  Config_AppName } from './src/entity/Config_Appname';

import {RefreshToken} from './src/entity/RefreshToken'
import { refreshTokens } from './src/memory/memoryStore';

import { UserRoleLookup } from './src/entity/UserRoleLookup';
//import { RolePermission } from './src/entity/RolePermission';
import { Permission } from './src/entity/Permission';








import { Option } from './src/entity/Option';




import { AutocodeCounter } from './src/entity/AutocodeCounter';
import { UserTenantContext } from './src/entity/UserTenantContext';
import { Tenant } from './src/entity/Tenant';
import { TenantTypeLookup } from './src/entity/TenantTypeLookup';
import { Product } from './src/entity/Product';
//import { product_table_fields } from './src/entity/product_table_fields';
import { User_table_fields } from './src/entity/user_table_fields';
import { TenantStrategy } from './src/entity/TenantStrategy';
import { Customer } from './src/entity/Customer';
import { Tenant_custom_scripts } from './src/entity/Tenant_custom_scripts';
//import { product_table_fields_tenantwise } from './src/entity/product_table_fields_tenantwise';
import { TenantFormConfigs } from './src/entity/TenantFormConfigs'
import { PurchaseOrder } from './src/entity/PurchaseOrder';
import { PurchaseOrderItem } from './src/entity/PurchaseOrderItem';
import { Vendor } from './src/entity/Vendor';
import { CustomerCategory } from './src/entity/CustomerCategory';
import { Leadsource } from './src/entity/LeadSource';
import { SubscriptionPlanLookup } from './src/entity/SubscriptionPlanLookup';
import { ClientStatus } from './src/entity/LeadStatus';
import { Site } from './src/entity/Site';
import { City } from './src/entity/city';
//import { product_template_table_fields } from './src/entity/product_template_table_fields';
import { product_template_table_fields_tenantwise } from './src/entity/product_template_table_fields_tenantwise';
import { ProductTemplate } from './src/entity/product_template';
 
import { ProductVariant } from './src/entity/productVariant';
//import { product_variant_table_fields } from './src/entity/product_variant_table_fields';
import { SalesOrder } from './src/entity/SalesOrder';
import { SalesOrderItem } from './src/entity/SalesOrderItem';
import { DeliveryChallan } from './src/entity/DeliveryChallan';
import { DeliveryChallanItem } from './src/entity/DeliveryChallanItem';
import { DocumentSequence } from './src/entity/DocumentSequence';
import { CustomerCategoryMapping } from './src/entity/CustomerCategoryMapping';
import { HsnTaxRule } from './src/entity/HsnTaxRule';
import { ClientPurchaseOrder } from './src/entity/ClientPurchaseOrder';
import { ClientPurchaseOrderItem } from './src/entity/ClientPurchaseOrderItem';
import { ProductUomConversion } from './src/entity/ProductUomConversion';
import { UserPreferences } from './src/entity/user_preferences';
import { District } from './src/entity/District';
import { ClientRequirement } from './src/entity/ClientRequirement';
import { Quotation } from './src/entity/Quotation';
import { ClientRequirementItem } from './src/entity/ClientRequirementItem';
import { QuotationItem } from './src/entity/QuotationItem';
import { ProductCategory } from './src/entity/ProductCategory';
import { RolePermission } from './src/entity/RolePermission';
import { LineDiscount } from './src/entity/LineDiscount';
import { DiscountType } from './src/entity/DiscountType';
import { Interaction } from './src/entity/Interaction';
import { ClientRFQOrder } from './src/entity/ClientRFQOrder';
import { ClientRFQOrderItem } from './src/entity/ClientRFQOrderItem';
import { Promotion } from './src/entity/Promotion';
import { PromotionAction } from './src/entity/PromotionAction';
import { PromotionCondition } from './src/entity/PromotionCondition';



// Load environment variables (ensure this runs at application startup)
dotenv.config();

// Define your TypeORM DataSource configuration
// This replaces your previous dbConfig/dbConfigGearHost
export const AppDataSource = new DataSource({
    type: 'mssql', // Specifies SQL Server
    host: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10), // Default SQL Server port
    username: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD  || 'saadmin',
    database: process.env.DB_DATABASE || 'test',
      
    // Set to true to automatically create database schema on sync (development only)
    // For production, use migrations (TypeORM generates these)
    //synchronize: false, // Set to true for initial development to auto-create tables, then set to false and use migrations
    synchronize: true,
    logging: false, // Set to true to see SQL queries in console  RolePermission,
  //logging:['query','error'],
     
    entities: [
        //Global Masters -----------------------------------------------
        HsnTaxRule,Leadsource,SubscriptionPlanLookup,
        //End global master --------------------------------------------
        User,UserRoleLookup,Permission,RolePermission,RefreshToken,SecuritySettings,Config,Config_AppName,Tenant,TenantTypeLookup
    ,Option,UserTenantContext  
    ,Quotation,QuotationItem
    ,ClientRequirement,ClientRequirementItem

    ,ProductTemplate,ProductVariant //with variant
    , Product,ProductCategory,
    //,product_table_fields,    product_table_fields_tenantwise
   // ,product_template_table_fields,product_variant_table_fields,
    product_template_table_fields_tenantwise,
    ProductUomConversion,
    User_table_fields, TenantStrategy, 
    Customer, CustomerCategory, Vendor, City, District
    ,Tenant_custom_scripts, TenantFormConfigs
    ,PurchaseOrder,PurchaseOrderItem   
    ,ClientPurchaseOrder,ClientPurchaseOrderItem 
    ,ClientRFQOrder,ClientRFQOrderItem
    ,SalesOrder,SalesOrderItem
    ,DeliveryChallan,DeliveryChallanItem
    ,Leadsource,ClientStatus,Site

    ,LineDiscount,DiscountType, Promotion, PromotionAction, PromotionCondition
    ,Interaction
,AutocodeCounter ,DocumentSequence, CustomerCategoryMapping
,UserPreferences], 

// src/data-source.ts
// entities: [
//   Settings, 
//     User, UserRoleLookup, Permission, RefreshToken, Config, Config_AppName, Tenant, 
//     TenantTypeLookup, SubscriptionPlanLookup, Option, UserTenantContext,
//     ProductTemplate, ProductVariant, HsnTaxRule, 
//     Product, // 👈 Keep this one
//     product_template_table_fields_tenantwise, ProductUomConversion, User_table_fields, 
//     TenantStrategy, Customer, CustomerCategory, Vendor, City, District, 
//     Tenant_custom_scripts, TenantFormConfigs, PurchaseOrder, PurchaseOrderItem, 
//     ClientPurchaseOrder, ClientPurchaseOrderItem, SalesOrder, SalesOrderItem, 
//     DeliveryChallan, DeliveryChallanItem, Leadsource, ClientStatus, Site, 
//     AutocodeCounter, DocumentSequence, CustomerCategoryMapping, UserPreferences
//     // ❌ REMOVED THE DUPLICATE ", Product," FROM HERE
// ],

// Register your entities here
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