// src/dependencies.ts
import { AppDataSource } from '../data-source';
//added 
import { Repository, EntityManager } from 'typeorm';


import UserService from './services/UserService'; // Class import
 import RefreshTokenService from './services/RefreshTokenService';
import SettingsService from './services/SettingsService'; // Class import
import c from './services/ConfigService';



import { Settings } from './entity/Settings'; 
import {Config} from './entity/Config';
import {Config_AppName} from './entity/Config_Appname';

import { User } from './entity/User'; import {Product} from './entity/Product'
import { RefreshToken } from './entity/RefreshToken';
import { SubscriptionPlanLookup } from './entity/SubscriptionPlanLookup';
import { UserRoleLookup } from './entity/UserRoleLookup';



import { Option} from './entity/Option'
import TenantService from './services/TenantService'; import Tenant_custom_scriptsService from './services/Tenant_custom_scriptsService'
import { Tenant } from './entity/Tenant';
import { TenantTypeLookup } from './entity/TenantTypeLookup';
import ConfigService from './services/ConfigService';
import ConfigAppNameService from './services/ConfigAppNameService';
import ProductService from './services/ProductService';
import ProductTemplateService from './services/ProductTemplateService';

import User_tableService from './services/user_table.service';
//import product_tableService from './services/product_table.service';
import { User_table_fields } from './entity/user_table_fields';
//import { product_table_fields } from './entity/product_table_fields';
import { UserTenantContext } from './entity/UserTenantContext';
import TenantStrategyService from './services/TenantStrategyService';
import CustomerService from './services/Customerservice';
import { TenantStrategy } from './entity/TenantStrategy';
import { Customer } from './entity/Customer';
import { Tenant_custom_scripts } from './entity/Tenant_custom_scripts';
import TenantFormService from './services/TenantFormService';
import { TenantFormConfigs } from './entity/TenantFormConfigs';
import VendorService from './services/VendorService';
import { Vendor } from './entity/Vendor';
import PurchaseService from './services/PurchaseService';
import { PurchaseOrder } from './entity/PurchaseOrder';
import CustomerCategoryService from './services/CustomerCategoryService';
import { CustomerCategory } from './entity/CustomerCategory';
import { Site } from './entity/Site';
import LeadSourceService from './services/LeadSourceService';
import { Leadsource } from './entity/LeadSource';
import CityService from './services/CityService';
import { City } from './entity/city';
import { ProductTemplate } from './entity/product_template';
import SalesService from './services/SalesService';
import { SalesOrder } from './entity/SalesOrder';
import { DeliveryChallanService } from './services/DeliveryChallanService';
import { DeliveryChallan } from './entity/DeliveryChallan';
import HSNService from './services/HSNservice';
import { HsnTaxRule } from './entity/HsnTaxRule';
import SiteService from './services/SiteService';

import { ClientPurchaseOrder } from './entity/ClientPurchaseOrder';
import ProductUomConversionService from './services/productUOMconversionService';
import { ProductUomConversion } from './entity/ProductUomConversion';
import { ProductVariant } from './entity/productVariant';
import { ProductVariantService } from './services/ProductVariantService';
import User_PreferenceService from './services/User_PrefernceService';
import { UserPreferences } from './entity/user_preferences';
import DistrictService from './services/DistrictService';
import { District } from './entity/District';
import ClientPurchaseService from './services/ClientPurchaseService';



//import { OrchestratorService } from './services/orchestrator.service';





//import TenantService from './services/TenantService';

// Declare instances that will be populated AFTER initialization


let userRepositoryInstance: UserService; 
let productRepositoryInstance: ProductService; let hsnTaxRuleRepositoryInstance:HSNService;
let productTemplateRepositoryInstance:ProductTemplateService;
let productVariantRepositoryInstance:ProductVariantService;
let purchaseOrderRepositoryInstance: PurchaseService; let salesOrderRepositoryInstance:SalesService
let clientPurchaseOrderRepository:ClientPurchaseService;
let deliveryChallanRepositoryInstance:DeliveryChallanService;

let vendorRepositoryInstance:VendorService; let cityRepositoryInstance:CityService;
let districtRepositoryInstance:DistrictService;
let hsnRepositoryInstance:HSNService;
 let refreshTokenRepositoryInstance: RefreshTokenService;
let settingsServiceInstance: SettingsService; 
let configServiceInstance:ConfigService; 
let user_PreferenceRepositoryInstance:User_PreferenceService;

let user_tableServiceInstance:User_tableService; 
//let product_tableServiceInstance:product_tableService;
let configAppNameServiceInstance:ConfigAppNameService



let tenantServiceInstance: TenantService; let tenantCustomScriptsInstance:Tenant_custom_scriptsService;
let tenantFormServiceInstance :TenantFormService;
let tenantStrategyServiceInstance: TenantStrategyService; 
let customerServiceInstance: CustomerService; let siteServiceInstance:SiteService;
let productUOMconversionServiceInstance:ProductUomConversionService
let customerCategoryServiceInstance: CustomerCategoryService;
let leadSourceServiceInstance:LeadSourceService;  



//let enrollTransactionalServiceInstance:OrchestratorService;

/**
 * Initializes all core application dependencies including database connection,
 * repositories, and services. This must be called ONCE at application startup.
 */
export async function initializeDependencies(): Promise<void> {
    // 1. Initialize AppDataSource if it's not already (should be done in server.ts ideally)
    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
            console.log("Data Source has been initialized by dependencies.ts.");
        } catch (err) {
            console.error("Error during Data Source initialization in dependencies.ts:", err);
            process.exit(1); // Critical failure: exit application
        }
    }

    
   

    userRepositoryInstance = new UserService();
      // Pass the actual TypeORM repository instance to the service's init method
      await userRepositoryInstance.init(AppDataSource.getRepository(User),AppDataSource.getRepository(UserRoleLookup),AppDataSource.getRepository(UserTenantContext));
    // refreshTokenRepositoryInstance = new RefreshTokenRepository();
    console.log("UserRepository and RefreshTokenRepository instances created.");



    productRepositoryInstance = new ProductService();
      // Pass the actual TypeORM repository instance to the service's init method
      await productRepositoryInstance.init(AppDataSource.getRepository(Product));

    console.log("ProductRepository  instances created.");

    hsnTaxRuleRepositoryInstance=new HSNService();
      // Pass the actual TypeORM repository instance to the service's init method
      await hsnTaxRuleRepositoryInstance.init(AppDataSource.getRepository(HsnTaxRule));

    console.log("ProductRepository  instances created.");


//Product with variant 
    productTemplateRepositoryInstance = new ProductTemplateService();
      // Pass the actual TypeORM repository instance to the service's init method
      await productTemplateRepositoryInstance.init(AppDataSource.getRepository(ProductTemplate));

    console.log("ProductTemplateRepository  instances created.");

     productVariantRepositoryInstance = new ProductVariantService();
      // Pass the actual TypeORM repository instance to the service's init method
      await productVariantRepositoryInstance.init(AppDataSource.getRepository(ProductVariant));

    console.log("ProductVariantRepository  instances created.");


    purchaseOrderRepositoryInstance = new PurchaseService();
      // Pass the actual TypeORM repository instance to the service's init method
      await purchaseOrderRepositoryInstance.init(AppDataSource.getRepository(PurchaseOrder)    );

    console.log("PurchaseOrderRepository  instances created.");


    
    clientPurchaseOrderRepository = new ClientPurchaseService();
      // Pass the actual TypeORM repository instance to the service's init method
      await clientPurchaseOrderRepository.init(AppDataSource.getRepository(ClientPurchaseOrder));

    console.log("clientPurchaseOrderRepository  instances created.");

    //deliveryChallanRepositoryInstance
deliveryChallanRepositoryInstance = new DeliveryChallanService();
      // Pass the actual TypeORM repository instance to the service's init method
      await deliveryChallanRepositoryInstance.init(AppDataSource.getRepository(DeliveryChallan));

    console.log("DeliveryChallanRepository  instances created.");


    salesOrderRepositoryInstance = new SalesService();
      // Pass the actual TypeORM repository instance to the service's init method
      await salesOrderRepositoryInstance.init(AppDataSource.getRepository(SalesOrder));

    console.log("PurchaseOrderRepository  instances created.");


      vendorRepositoryInstance = new VendorService();
      // Pass the actual TypeORM repository instance to the service's init method
      await vendorRepositoryInstance.init(AppDataSource.getRepository(Vendor));

    console.log("VendorRepository  instances created.");
//

 hsnRepositoryInstance = new HSNService();
      // Pass the actual TypeORM repository instance to the service's init method
      await hsnRepositoryInstance.init(AppDataSource.getRepository(HsnTaxRule));

    console.log("HSNRepository  instances created.");

      cityRepositoryInstance = new CityService();
      // Pass the actual TypeORM repository instance to the service's init method
      await cityRepositoryInstance.init(AppDataSource.getRepository(City));

    console.log("CITYRepository  instances created.");

    
  districtRepositoryInstance = new DistrictService();
      // Pass the actual TypeORM repository instance to the service's init method
      await districtRepositoryInstance.init(AppDataSource.getRepository(District));

    console.log("DistrictRepository  instances created.");


    refreshTokenRepositoryInstance = new RefreshTokenService();
    // Pass the actual TypeORM repository instance to the service's init method
    await refreshTokenRepositoryInstance.init(AppDataSource.getRepository(RefreshToken));
    console.log("refreshTokenServiceInstance initialized");
    
    

    // 3. Instantiate and Initialize SettingsService
    // We pass AppDataSource.getRepository(Settings) to its init method
    // to ensure it gets the repository after DataSource is ready.
    settingsServiceInstance = new SettingsService();
    // Pass the actual TypeORM repository instance to the service's init method
    await settingsServiceInstance.init(AppDataSource.getRepository(Settings));
    await settingsServiceInstance.ensureDefaultSettings(); // Ensure default settings exist and are loaded
    console.log("SettingsService initialized and default settings ensured.");

  // 4. Instantiate and Initialize ConfigService
    // We pass AppDataSource.getRepository(Config) to its init method
    // to ensure it gets the repository after DataSource is ready.
    configServiceInstance = new ConfigService();
    // Pass the actual TypeORM repository instance to the service's init method
    await configServiceInstance.init(AppDataSource.getRepository(Config));
    console.log("ConfigService initialized and default config ensured.");

     user_PreferenceRepositoryInstance = new User_PreferenceService();
    // Pass the actual TypeORM repository instance to the service's init method
    await user_PreferenceRepositoryInstance.init(AppDataSource.getRepository(UserPreferences));
    console.log("UserPreferenceService initialized and default config ensured.");


    // 5. Instantiate and Initialize User_tableService
    // We pass AppDataSource.getRepository(User_table) to its init method
    // to ensure it gets the repository after DataSource is ready.
    user_tableServiceInstance = new User_tableService();
    // Pass the actual TypeORM repository instance to the service's init method
    await user_tableServiceInstance.init(AppDataSource.getRepository(User_table_fields));
    console.log("User_tableService initialized and default user_table ensured.");

  // 5. Instantiate and Initialize Product_tableService
    // We pass AppDataSource.getRepository(Product_table) to its init method
    // to ensure it gets the repository after DataSource is ready.
    // product_tableServiceInstance = new product_tableService();
    // // Pass the actual TypeORM repository instance to the service's init method
    // await product_tableServiceInstance.init(AppDataSource.getRepository(product_table_fields));
    // console.log("Product_tableService initialized and default product_table ensured.");


    // 5. Instantiate and Initialize ConfigAppNameService
    // We pass AppDataSource.getRepository(ConfigAppName) to its init method
    // to ensure it gets the repository after DataSource is ready.
    configAppNameServiceInstance = new ConfigAppNameService();
    // Pass the actual TypeORM repository instance to the service's init method
    await configAppNameServiceInstance.init(AppDataSource.getRepository(Config_AppName));
    console.log("ConfigAppNameService initialized and default configAppName ensured.");

    tenantServiceInstance = new TenantService();
    // Pass the actual TypeORM repository instance to the service's init method
    await tenantServiceInstance.init(AppDataSource.getRepository(Tenant),AppDataSource.getRepository(TenantTypeLookup),AppDataSource.getRepository(SubscriptionPlanLookup));
    console.log("tenantServiceInstance initialized");
    
    tenantFormServiceInstance = new TenantFormService();
    // Pass the actual TypeORM repository instance to the service's init method
    await tenantFormServiceInstance.init(AppDataSource.getRepository(TenantFormConfigs));
    console.log("tenantServiceInstance initialized");
    

    tenantCustomScriptsInstance = new Tenant_custom_scriptsService();
    // Pass the actual TypeORM repository instance to the service's init method
    await tenantCustomScriptsInstance.init(AppDataSource.getRepository(Tenant_custom_scripts));
    console.log("tenantCustomScriptServiceInstance initialized");
    

     tenantStrategyServiceInstance = new TenantStrategyService();
    // Pass the actual TypeORM repository instance to the service's init method
    await tenantStrategyServiceInstance.init(AppDataSource.getRepository(TenantStrategy));
    console.log("tenantStrategyServiceInstance initialized");
    
    customerServiceInstance = new CustomerService();
    // Pass the actual TypeORM repository instance to the service's init method
    await customerServiceInstance.init(AppDataSource.getRepository(Customer),AppDataSource.getRepository(Site));
    console.log("customerServiceInstance initialized");
    

    productUOMconversionServiceInstance = new ProductUomConversionService();
    // Pass the actual TypeORM repository instance to the service's init method
    await productUOMconversionServiceInstance.init(AppDataSource.getRepository(ProductUomConversion));
    console.log("productUOMconversionService initialized");


    siteServiceInstance = new SiteService();
    // Pass the actual TypeORM repository instance to the service's init method
    await siteServiceInstance.init(AppDataSource.getRepository(Site));
    console.log("siteServiceInstance initialized");
    

    customerCategoryServiceInstance = new CustomerCategoryService();
    // Pass the actual TypeORM repository instance to the service's init method
    await customerCategoryServiceInstance.init(AppDataSource.getRepository(CustomerCategory));
    console.log("customerCategoryServiceInstance initialized");
     
    leadSourceServiceInstance = new LeadSourceService();
    // Pass the actual TypeORM repository instance to the service's init method
    await leadSourceServiceInstance.init(AppDataSource.getRepository(Leadsource));
    console.log("leadSourceServiceInstance initialized");

    console.log("All core application dependencies initialized successfully.");
}
 
// // Public getters for the initialized instances



export function getUserRepository(): UserService {
    if (!userRepositoryInstance) {
        throw new Error("UserRepository not initialized. Call initializeDependencies() first.");
    }
    return userRepositoryInstance;
}


export function getProductRepository(): ProductService {
    if (!productRepositoryInstance) {
        throw new Error("ProductRepository not initialized. Call initializeDependencies() first.");
    }
    return productRepositoryInstance;
}
//with variant
export function getProductTemplateRepository(): ProductTemplateService {
    if (!productTemplateRepositoryInstance) {
        throw new Error("ProductTemplateRepository not initialized. Call initializeDependencies() first.");
    }
    return productTemplateRepositoryInstance;
}


export function getProductVariantRepository(): ProductVariantService {
    if (!productVariantRepositoryInstance) {
        throw new Error("ProductVariantRepository not initialized. Call initializeDependencies() first.");
    }
    return productVariantRepositoryInstance;
}


export function getHsnTaxRuleRepository(): HSNService {
    if (!hsnTaxRuleRepositoryInstance) {
        throw new Error("HSNTaxRuleProductRepository not initialized. Call initializeDependencies() first.");
    }
    return hsnTaxRuleRepositoryInstance;
}
export function getPurchaseOrderRepository(): PurchaseService {
    if (!purchaseOrderRepositoryInstance) {
        throw new Error("PurchaseOrderRepository not initialized. Call initializeDependencies() first.");
    }
    return purchaseOrderRepositoryInstance;
}


export function getClientPurchaseOrderRepository(): ClientPurchaseService {
    if (!clientPurchaseOrderRepository) {
        throw new Error("clientPurchaseOrderRepository not initialized. Call initializeDependencies() first.");
    }
    return clientPurchaseOrderRepository;
}


export function getDeliveryChallanRepository(): DeliveryChallanService {
    if (!deliveryChallanRepositoryInstance) {
        throw new Error("DeliveryChallanRepository not initialized. Call initializeDependencies() first.");
    }
    return deliveryChallanRepositoryInstance;
}

export function getSalesOrderRepository(): SalesService {
    if (!salesOrderRepositoryInstance) {
        throw new Error("SalesOrderRepository not initialized. Call initializeDependencies() first.");
    }
    return salesOrderRepositoryInstance;
}

export function getVendorRepository(): VendorService {
    if (!vendorRepositoryInstance) {
        throw new Error("VendorRepository not initialized. Call initializeDependencies() first.");
    }
    return vendorRepositoryInstance;
}
export function getHSNRepository(): HSNService {
    if (!hsnRepositoryInstance) {
        throw new Error("HSNRepository not initialized. Call initializeDependencies() first.");
    }
    return hsnRepositoryInstance;
}


export function getCityRepository(): CityService {
    if (!cityRepositoryInstance) {
        throw new Error("CityRepository not initialized. Call initializeDependencies() first.");
    }
    return cityRepositoryInstance;
}

export function getDistrictRepository(): DistrictService {
    if (!districtRepositoryInstance) {
        throw new Error("DistrictRepository not initialized. Call initializeDependencies() first.");
    }
    return districtRepositoryInstance;
}


//getUser_PreferenceRepository
export function getUser_PreferenceRepository(): User_PreferenceService {
    if (!user_PreferenceRepositoryInstance) {
        throw new Error("User_PreferenceRepository not initialized. Call initializeDependencies() first.");
    }
    return user_PreferenceRepositoryInstance;
}


//



  


export function getRefreshTokenRepository(): RefreshTokenService {
    if (!refreshTokenRepositoryInstance) {
        throw new Error("RefreshTokenRepository not initialized. Call initializeDependencies() first.");
    }
    return refreshTokenRepositoryInstance;
}

export function getSettingsServiceRepository(): SettingsService {
    if (!settingsServiceInstance) {
        throw new Error("SettingsService not initialized. Call initializeDependencies() first.");
    }
    return settingsServiceInstance;
}
export function getConfigServiceRepository(): ConfigService {
    if (!configServiceInstance) {
        throw new Error("ConfigService not initialized. Call initializeDependencies() first.");
    }
    return configServiceInstance;
}
export function getUser_tableServiceRepository(): User_tableService {
    if (!user_tableServiceInstance) {
        throw new Error("User_tableService not initialized. Call initializeDependencies() first.");
    }
    return user_tableServiceInstance;
}
// export function getProduct_tableServiceRepository(): product_tableService {
//     if (!product_tableServiceInstance) {
//         throw new Error("Product_tableService not initialized. Call initializeDependencies() first.");
//     }
//     return product_tableServiceInstance;
// }
export function getConfigAppNameServiceRepository(): ConfigAppNameService {
    if (!configAppNameServiceInstance) {
        throw new Error("ConfigAppNameService not initialized. Call initializeDependencies() first.");
    }
    return configAppNameServiceInstance;
}
export function getTenantServiceRepository(): TenantService {
    if (!tenantServiceInstance) {
        throw new Error("TenantService not initialized. Call initializeDependencies() first.");
    }
    return tenantServiceInstance;
} 


export function getTenantFormServiceRepository(): TenantFormService {
    if (!tenantFormServiceInstance) {
        throw new Error("TenantForm not initialized. Call initializeDependencies() first.");
    }
    return tenantFormServiceInstance;
} 

export function getTenantCustomScriptsServiceRepository(): Tenant_custom_scriptsService {
    if (!tenantCustomScriptsInstance) {
        throw new Error("tenantCustomScriptsService not initialized. Call initializeDependencies() first.");
    }
    return tenantCustomScriptsInstance;
} 

export function getTenantStrategyServiceRepository(): TenantStrategyService {
    if (!tenantStrategyServiceInstance) {
        throw new Error("TenantStrategyService not initialized. Call initializeDependencies() first.");
    }
    return tenantStrategyServiceInstance;
} 


export function getCustomerServiceRepository(): CustomerService {
    if (!customerServiceInstance) {
        throw new Error("CustomerServiceInstance not initialized. Call initializeDependencies() first.");
    }
    return customerServiceInstance;
} 

export function getSiteRepository(): SiteService {
    if (!siteServiceInstance) {
        throw new Error("SiteServiceInstance not initialized. Call initializeDependencies() first.");
    }
    return siteServiceInstance;
}
//ProductUomConversion
export function getProductUomConversionRepository(): ProductUomConversionService {
    if (!productUOMconversionServiceInstance) {
        throw new Error("productUOMconversionServiceInstance not initialized. Call initializeDependencies() first.");
    }
    return productUOMconversionServiceInstance;
}
export function getCustomerCategoryServiceRepository(): CustomerCategoryService {
    if (!customerCategoryServiceInstance) {
        throw new Error("CustomerCategoryServiceInstance not initialized. Call initializeDependencies() first.");
    }
    return customerCategoryServiceInstance;
} 
export function getLeadSourceServiceRepository(): LeadSourceService {
    if (!leadSourceServiceInstance) {
        throw new Error("LeadSourceServiceInstance not initialized. Call initializeDependencies() first.");
    }
    return leadSourceServiceInstance;
} 
