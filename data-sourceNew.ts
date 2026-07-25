// src/data-source.ts
import 'reflect-metadata'; 
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Import all entities
import { User } from './src/entity/User'; 
import { SecuritySettings } from './src/entity/SecuritySettings';
import { Config } from './src/entity/Config';
import { Config_AppName } from './src/entity/Config_Appname';
import { RefreshToken } from './src/entity/RefreshToken';
import { SubscriptionPlanLookup } from './src/entity/SubscriptionPlanLookup';
import { UserRoleLookup } from './src/entity/UserRoleLookup';
import { Permission } from './src/entity/Permission';
import { Option } from './src/entity/Option';
import { AutocodeCounter } from './src/entity/AutocodeCounter';
import { UserTenantContext } from './src/entity/UserTenantContext';
import { Tenant } from './src/entity/Tenant';
import { TenantTypeLookup } from './src/entity/TenantTypeLookup';
import { Product } from './src/entity/Product';
import { User_table_fields } from './src/entity/user_table_fields';
import { TenantStrategy } from './src/entity/TenantStrategy';
import { Customer } from './src/entity/Customer';
import { Tenant_custom_scripts } from './src/entity/Tenant_custom_scripts';
import { TenantFormConfigs } from './src/entity/TenantFormConfigs';
import { PurchaseOrder } from './src/entity/PurchaseOrder';
import { PurchaseOrderItem } from './src/entity/PurchaseOrderItem';
import { Vendor } from './src/entity/Vendor';
import { CustomerCategory } from './src/entity/CustomerCategory';
import { Leadsource } from './src/entity/LeadSource';
import { ClientStatus } from './src/entity/LeadStatus';
import { Site } from './src/entity/Site';
import { City } from './src/entity/city';
import { product_template_table_fields_tenantwise } from './src/entity/product_template_table_fields_tenantwise';
import { ProductTemplate } from './src/entity/product_template';
import { ProductVariant } from './src/entity/productVariant';
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

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'mssql', 
    host: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10), 
    username: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'saadmin',
    database: process.env.DB_DATABASE || 'test',
    
    // Enable strict query logging to output compilation metadata errors instantly
    logging: ['query', 'error'], 
    synchronize: true,
    
    // 💡 CLEAN LIST: Zero duplicate entries, Settings moved to front
    entities: [
        SecuritySettings,
        User,
        UserRoleLookup,
        Permission,
        RefreshToken,
        Config,
        Config_AppName,
        Tenant,
        TenantTypeLookup,
        SubscriptionPlanLookup,
        Option,
        UserTenantContext,
        ProductTemplate,
        ProductVariant,
        HsnTaxRule, 
        Product, 
        product_template_table_fields_tenantwise,
        ProductUomConversion,
        User_table_fields,
        TenantStrategy, 
        Customer,
        CustomerCategory,
        Vendor,
        City,
        District,
        Tenant_custom_scripts,
        TenantFormConfigs,
        PurchaseOrder,
        PurchaseOrderItem,   
        ClientPurchaseOrder,
        ClientPurchaseOrderItem, 
        SalesOrder,
        SalesOrderItem,
        DeliveryChallan,
        DeliveryChallanItem,
        Leadsource,
        ClientStatus,
        Site,
        AutocodeCounter,
        DocumentSequence,
        CustomerCategoryMapping,
        UserPreferences
    ], 
    
    migrations: [], 
    subscribers: [],     

    // 💡 FORCED EXTRA DRIVER RULES: This breaks TLS handshake freezes completely
    extra: {
        trustServerCertificate: true, 
        encrypt: false,               
        connectionTimeout: 4000,      // ⏱️ Times out connection at 4s (faster than your 10s watchdog)
        requestTimeout: 4000          // ⏱️ Times out stuck queries at 4s
    },
    
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
});
