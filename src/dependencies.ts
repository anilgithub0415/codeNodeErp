// src/dependencies.ts
import { AppDataSource } from '../data-source';
//added 
import { Repository, EntityManager } from 'typeorm';


import UserService from './services/UserService'; // Class import
 import RefreshTokenService from './services/RefreshTokenService';
import SettingsService from './services/SettingsService'; // Class import



import { Settings } from './entity/Settings'; 

import { User } from './entity/User';
import { RefreshToken } from './entity/RefreshToken';
import { SubscriptionPlanLookup } from './entity/SubscriptionPlanLookup';
import { UserRoleLookup } from './entity/UserRoleLookup';



import { Option} from './entity/Option'
import TenantService from './services/TenantService';
import { Tenant } from './entity/Tenant';
import { TenantTypeLookup } from './entity/TenantTypeLookup';



//import { OrchestratorService } from './services/orchestrator.service';





//import TenantService from './services/TenantService';

// Declare instances that will be populated AFTER initialization


let userRepositoryInstance: UserService;
 let refreshTokenRepositoryInstance: RefreshTokenService;
let settingsServiceInstance: SettingsService;



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
      await userRepositoryInstance.init(AppDataSource.getRepository(User),AppDataSource.getRepository(UserRoleLookup));
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


export function getTenantServiceRepository(): TenantService {
    if (!tenantServiceInstance) {
        throw new Error("TenantService not initialized. Call initializeDependencies() first.");
    }
    return tenantServiceInstance;
} 