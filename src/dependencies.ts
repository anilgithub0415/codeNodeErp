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

import { User } from './entity/User';
import { RefreshToken } from './entity/RefreshToken';
import { SubscriptionPlanLookup } from './entity/SubscriptionPlanLookup';
import { UserRoleLookup } from './entity/UserRoleLookup';



import { Option} from './entity/Option'
import TenantService from './services/TenantService';
import { Tenant } from './entity/Tenant';
import { TenantTypeLookup } from './entity/TenantTypeLookup';
import ConfigService from './services/ConfigService';
import ConfigAppNameService from './services/ConfigAppNameService';
import User_tableService from './services/user_table.service';
import { User_table_fields } from './entity/user_table_fields';



//import { OrchestratorService } from './services/orchestrator.service';





//import TenantService from './services/TenantService';

// Declare instances that will be populated AFTER initialization


let userRepositoryInstance: UserService;
 let refreshTokenRepositoryInstance: RefreshTokenService;
let settingsServiceInstance: SettingsService; 
let configServiceInstance:ConfigService; 
let user_tableServiceInstance:User_tableService;
let configAppNameServiceInstance:ConfigAppNameService



let tenantServiceInstance: TenantService;  
  



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
      await userRepositoryInstance.init(AppDataSource.getRepository(User),AppDataSource.getRepository(UserRoleLookup),AppDataSource.getRepository(User_table_fields));
    // refreshTokenRepositoryInstance = new RefreshTokenRepository();
    console.log("UserRepository and RefreshTokenRepository instances created.");

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

    
  // 5. Instantiate and Initialize User_tableService
    // We pass AppDataSource.getRepository(User_table) to its init method
    // to ensure it gets the repository after DataSource is ready.
    user_tableServiceInstance = new User_tableService();
    // Pass the actual TypeORM repository instance to the service's init method
    await user_tableServiceInstance.init(AppDataSource.getRepository(User_table_fields));
    console.log("User_tableService initialized and default user_table ensured.");

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
    
        


    console.log("All core application dependencies initialized successfully.");
}
 
// // Public getters for the initialized instances



export function getUserRepository(): UserService {
    if (!userRepositoryInstance) {
        throw new Error("UserRepository not initialized. Call initializeDependencies() first.");
    }
    return userRepositoryInstance;
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