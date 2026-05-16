// src/dependencies.ts
import { AppDataSource } from '../data-source';
//added 
import { Repository, EntityManager } from 'typeorm';

import PersonService from './services/PersonService';
import UserService from './services/UserService'; // Class import
 import RefreshTokenService from './services/RefreshTokenService';
import SettingsService from './services/SettingsService'; // Class import
import TenantService from './services/TenantService';


import { Settings } from './entity/Settings'; 
import { Tenant } from './entity/Tenant'; // <--- NEW: Ensure Tenant is imported for getRepository
import { Person } from './entity/Person';
import { User } from './entity/User';
import { RefreshToken } from './entity/RefreshToken';
import { TenantTypeLookup } from './entity/TenantTypeLookup';
import { SubscriptionPlanLookup } from './entity/SubscriptionPlanLookup';
import { UserRoleLookup } from './entity/UserRoleLookup';
import { UserTenantContext } from './entity/UserTenantContext';

import ExamTypeService from './services/ExamtypeService';
import { ExamType } from './entity/ExamType';

import { Option} from './entity/Option'

import { QuestionTypeLookup } from './entity/QuestionTypeLookup';


import EnrollService from './services/EnrollService';
import { Enrollment } from './entity/Enrollment';
import StudentProfileService from './services/StudentProfileService';
import { StudentProfile } from './entity/StudentProfile';
//import { OrchestratorService } from './services/orchestrator.service';


import { FacultyProfile } from './entity/FacultyProfile';
import FacultyProfileService from './services/FacultyProfileService';


import TopicService from './services/TopicService';
import { Topic } from './entity/Topic';

import OptionService from './services/OptionService';

import { StudentQuestionAnswer } from './entity/StudentQuestionAnswer';
//import TenantService from './services/TenantService';

// Declare instances that will be populated AFTER initialization

let personRepositoryInstance: PersonService;let StudentProfileRepositoryInstance:StudentProfileService;
let userRepositoryInstance: UserService;
 let refreshTokenRepositoryInstance: RefreshTokenService;
let settingsServiceInstance: SettingsService;


let examtypeServiceInstance:ExamTypeService;
  let questionOptionServiceInstance:OptionService;


let topicServiceInstance:TopicService;
let facultyProfileServiceInstance:FacultyProfileService
let enrollServiceInstance:EnrollService;
//let enrollTransactionalServiceInstance:OrchestratorService;

let tenantServiceInstance: TenantService; 
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

    // // 2. Instantiate Repositories
    
    personRepositoryInstance = new PersonService(); 
      // Pass the actual TypeORM repository instance to the service's init method
      await personRepositoryInstance.init(AppDataSource.getRepository(Person));
    // refreshTokenRepositoryInstance = new RefreshTokenRepository();
    console.log("PersonRepository and RefreshTokenRepository instances created.");

    //
    StudentProfileRepositoryInstance = new StudentProfileService; 
    // Pass the actual TypeORM repository instance to the service's init method
    await StudentProfileRepositoryInstance.init(AppDataSource.getRepository(StudentProfile));
  // refreshTokenRepositoryInstance = new RefreshTokenRepository();
  console.log("StudentProfileRepository and RefreshTokenRepository instances created.");


    userRepositoryInstance = new UserService();
      // Pass the actual TypeORM repository instance to the service's init method
      await userRepositoryInstance.init(AppDataSource.getRepository(User),AppDataSource.getRepository(Tenant),AppDataSource.getRepository(UserRoleLookup),AppDataSource.getRepository(UserTenantContext));
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

    
     examtypeServiceInstance = new ExamTypeService();
    // Pass the actual TypeORM repository instance to the service's init method
    await examtypeServiceInstance.init(AppDataSource.getRepository(ExamType));
    console.log("examtypeServiceInstance initialized");

    
    
    //
    questionOptionServiceInstance = new OptionService();
    // Pass the actual TypeORM repository instance to the service's init method
    await questionOptionServiceInstance.init(AppDataSource.getRepository(Option));
    console.log("questionOptionServiceInstance initialized");




//
topicServiceInstance = new TopicService();
// Pass the actual TypeORM repository instance to the service's init method
await topicServiceInstance.init(AppDataSource.getRepository(Topic));
console.log("topicServiceInstance initialized");


//
facultyProfileServiceInstance = new FacultyProfileService();
// Pass the actual TypeORM repository instance to the service's init method
await facultyProfileServiceInstance.init(AppDataSource.getRepository(FacultyProfile));
console.log("facultyProfileServiceInstance initialized");
 
//  
enrollServiceInstance = new EnrollService();
// Pass the actual TypeORM repository instance to the service's init method
await enrollServiceInstance.init(AppDataSource.getRepository(Enrollment));
console.log("enrollServiceInstance initialized");

//
//enrollTransactionalServiceInstance = new OrchestratorService();
// Pass the actual TypeORM repository instance to the service's init method
//await enrollTransactionalServiceInstance.init(AppDataSource.getRepository(Enrollment));
//console.log("enrollTransactionalServiceInstance initialized");


    console.log("All core application dependencies initialized successfully.");
}
 
// // Public getters for the initialized instances

export function getPersonRepository(): PersonService {
    if (!personRepositoryInstance) {
        throw new Error("PersonRepository not initialized. Call initializeDependencies() first.");
    }
    return personRepositoryInstance;
}


export function getStudentProfileRepository(): StudentProfileService {
    if (!StudentProfileRepositoryInstance) {
        throw new Error("StudentProfileRepository not initialized. Call initializeDependencies() first.");
    }
    return StudentProfileRepositoryInstance;
}

export function getUserRepository(): UserService {
    if (!userRepositoryInstance) {
        throw new Error("UserRepository not initialized. Call initializeDependencies() first.");
    }
    return userRepositoryInstance;
}





export function getExamTypeRepository(): ExamTypeService {
    if (!examtypeServiceInstance) {
        throw new Error("ExamTypeRepository not initialized. Call initializeDependencies() first.");
    }
    return examtypeServiceInstance;
}

//
export function getQuestionOptionRepository(): OptionService {
    if (!questionOptionServiceInstance) {
        throw new Error("QuestionOptionRepository not initialized. Call initializeDependencies() first.");
    }
    return questionOptionServiceInstance;
}


//



export function getTopicRepository(): TopicService {
    if (!topicServiceInstance) {
        throw new Error("TopicRepository not initialized. Call initializeDependencies() first.");
    }
    return topicServiceInstance;
}

  
//

export function getFacultyProfileRepository(): FacultyProfileService {
    if (!facultyProfileServiceInstance) {
        throw new Error("FacultyProfileRepository not initialized. Call initializeDependencies() first.");
    }
    return facultyProfileServiceInstance;
}
export function getEnrollRepository(): EnrollService {
    if (!enrollServiceInstance) {
        throw new Error("CourseOfferingRepository not initialized. Call initializeDependencies() first.");
    }
    return enrollServiceInstance;
}

// export function getEnrollTransactionalRepository(): OrchestratorService {
//     if (!enrollTransactionalServiceInstance) {
//         throw new Error("enrollTransactionalRepository not initialized. Call initializeDependencies() first.");
//     }
//     return enrollTransactionalServiceInstance;
// }

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