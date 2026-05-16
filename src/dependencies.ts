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
import ProgramService from './services/ProgramService';
import { Program } from './entity/Program';
import ExamTypeService from './services/ExamtypeService';
import { ExamType } from './entity/ExamType';
import { Question } from './entity/Question';
import { Option} from './entity/Option'
import QuestionService from './services/QuestionService';
import { QuestionTypeLookup } from './entity/QuestionTypeLookup';
import { QuestionCategoryLookup } from './entity/QuestionCategoryLookup';
import{ QuestionPurposeLookup} from './entity/QuestionPurposeLookup'
import CourseService from './services/CourseService';
import { Course } from './entity/Course';
import CourseOfferingService from './services/CourseOfferingService';
import { CourseOffering } from './entity/CourseOffering';
import EnrollService from './services/EnrollService';
import { Enrollment } from './entity/Enrollment';
import StudentProfileService from './services/StudentProfileService';
import { StudentProfile } from './entity/StudentProfile';
//import { OrchestratorService } from './services/orchestrator.service';
import { Subject } from './entity/Subject';
import SubjectService from './services/SubjectService';
import { FacultyProfile } from './entity/FacultyProfile';
import FacultyProfileService from './services/FacultyProfileService';
import { ProgramCourses } from './entity/ProgramCourses';
import ProgramCourseService from './services/ProgramCourseService';
import TopicService from './services/TopicService';
import { Topic } from './entity/Topic';
import { QuestionOrchestrationService } from './services/QuestionOrchestrationService';
import OptionService from './services/OptionService';
import { Assignment } from './entity/Assignment';
import AssignmentService from './services/AssignmentService';
import { AssignmentAttempt } from './entity/AssignmentAttempt';
import AssignmentAttemptService from './services/AssignmentAttemptService';
import { StudentQuestionAnswer } from './entity/StudentQuestionAnswer';
//import TenantService from './services/TenantService';

// Declare instances that will be populated AFTER initialization

let personRepositoryInstance: PersonService;let StudentProfileRepositoryInstance:StudentProfileService;
let userRepositoryInstance: UserService;let programRepositoryInstance:ProgramService;
 let refreshTokenRepositoryInstance: RefreshTokenService;
let settingsServiceInstance: SettingsService;
let programServiceInstance:ProgramService;let SubjectServiceInstance:SubjectService;
let programCourseServiceInstance:ProgramCourseService;
let examtypeServiceInstance:ExamTypeService;
let questionServiceInstance:QuestionService; let questionOrchestrationServiceInstance:QuestionOrchestrationService; let questionOptionServiceInstance:OptionService;
let courseServiceInstance:CourseService; 
let assignmentServiceInstance:AssignmentService; let assignmentAttemptServiceInstance:AssignmentAttemptService;
let topicServiceInstance:TopicService;
let courseOfferingServiceInstance:CourseOfferingService;let facultyProfileServiceInstance:FacultyProfileService
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

    
    programServiceInstance = new ProgramService();
    // Pass the actual TypeORM repository instance to the service's init method
    await programServiceInstance.init(AppDataSource.getRepository(Program));
    console.log("programServiceInstance initialized");

    //
    programCourseServiceInstance = new ProgramCourseService();
    // Pass the actual TypeORM repository instance to the service's init method
    await programCourseServiceInstance.init(AppDataSource.getRepository(ProgramCourses));
    console.log("programCourseServiceInstance initialized");

    //
    SubjectServiceInstance = new SubjectService();
    // Pass the actual TypeORM repository instance to the service's init method
    await SubjectServiceInstance.init(AppDataSource.getRepository(Subject));
    console.log("SubjectServiceInstance initialized");


    examtypeServiceInstance = new ExamTypeService();
    // Pass the actual TypeORM repository instance to the service's init method
    await examtypeServiceInstance.init(AppDataSource.getRepository(ExamType));
    console.log("examtypeServiceInstance initialized");

    
    questionServiceInstance = new QuestionService();
    // Pass the actual TypeORM repository instance to the service's init method
    await questionServiceInstance.init(AppDataSource.getRepository(Question),AppDataSource.getRepository(QuestionTypeLookup),AppDataSource.getRepository(QuestionCategoryLookup),AppDataSource.getRepository(QuestionPurposeLookup),AppDataSource.getRepository(Subject),AppDataSource.getRepository(Topic));
    console.log("questionServiceInstance initialized");

    //
    questionOptionServiceInstance = new OptionService();
    // Pass the actual TypeORM repository instance to the service's init method
    await questionOptionServiceInstance.init(AppDataSource.getRepository(Option));
    console.log("questionOptionServiceInstance initialized");

    //
    questionOrchestrationServiceInstance = new QuestionOrchestrationService();
    // Pass the actual TypeORM repository instance to the service's init method
   // await questionOrchestrationServiceInstance.init(AppDataSource.getRepository(Question),AppDataSource.getRepository(QuestionTypeLookup),AppDataSource.getRepository(QuestionCategoryLookup),AppDataSource.getRepository(QuestionPurposeLookup));
    console.log("questionOrchestrationServiceInstance initialized");


    courseServiceInstance = new CourseService();
// Pass the actual TypeORM repository instance to the service's init method
await courseServiceInstance.init(AppDataSource.getRepository(Course),AppDataSource.getRepository(ProgramCourses));
console.log("courseServiceInstance initialized");
//
assignmentServiceInstance = new AssignmentService();
// Pass the actual TypeORM repository instance to the service's init method
await assignmentServiceInstance.init(AppDataSource.getRepository(Assignment));
console.log("assignmentServiceInstance initialized");

//assignmentAttemptServiceInstance
assignmentAttemptServiceInstance = new AssignmentAttemptService();
// Pass the actual TypeORM repository instance to the service's init method
await assignmentAttemptServiceInstance.init(AppDataSource.getRepository(AssignmentAttempt),AppDataSource.getRepository(StudentQuestionAnswer));
console.log("assignmentAttemptServiceInstance initialized");


courseOfferingServiceInstance = new CourseOfferingService();
// Pass the actual TypeORM repository instance to the service's init method
await courseOfferingServiceInstance.init(AppDataSource.getRepository(CourseOffering));
console.log("courseOfferingServiceInstance initialized");

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


export function getProgramRepository(): ProgramService {
    if (!programServiceInstance) {
        throw new Error("ProgramRepository not initialized. Call initializeDependencies() first.");
    }
    return programServiceInstance;
}


export function getProgramCourseRepository(): ProgramCourseService {
    if (!programCourseServiceInstance) {
        throw new Error("ProgramCourseRepository not initialized. Call initializeDependencies() first.");
    }
    return programCourseServiceInstance;
}

//getSubjectRepository
export function getSubjectRepository(): SubjectService {
    if (!SubjectServiceInstance) {
        throw new Error("SubjectRepository not initialized. Call initializeDependencies() first.");
    }
    return SubjectServiceInstance;
}



export function getExamTypeRepository(): ExamTypeService {
    if (!examtypeServiceInstance) {
        throw new Error("ExamTypeRepository not initialized. Call initializeDependencies() first.");
    }
    return examtypeServiceInstance;
}


export function getQuestionRepository(): QuestionService {
    if (!questionServiceInstance) {
        throw new Error("QuestionRepository not initialized. Call initializeDependencies() first.");
    }
    return questionServiceInstance;
}
//
export function getQuestionOptionRepository(): OptionService {
    if (!questionOptionServiceInstance) {
        throw new Error("QuestionOptionRepository not initialized. Call initializeDependencies() first.");
    }
    return questionOptionServiceInstance;
}

export function getQuestionOrchestrationRepository(): QuestionOrchestrationService {
    if (!questionOrchestrationServiceInstance) {
        throw new Error("QuestionOrchestrationRepository not initialized. Call initializeDependencies() first.");
    }
    return questionOrchestrationServiceInstance;
}


export function getCourseRepository(): CourseService {
    if (!courseServiceInstance) {
        throw new Error("CourseRepository not initialized. Call initializeDependencies() first.");
    }
    return courseServiceInstance;
}
//
export function getAssignmentRepository(): AssignmentService {
    if (!assignmentServiceInstance) {
        throw new Error("AssignmentRepository not initialized. Call initializeDependencies() first.");
    }
    return assignmentServiceInstance;
}

//
export function getAssignmentAttemptRepository(): AssignmentAttemptService {
    if (!assignmentAttemptServiceInstance) {
        throw new Error("AssignmentAttemptRepository not initialized. Call initializeDependencies() first.");
    }
    return assignmentAttemptServiceInstance;
}


export function getTopicRepository(): TopicService {
    if (!topicServiceInstance) {
        throw new Error("TopicRepository not initialized. Call initializeDependencies() first.");
    }
    return topicServiceInstance;
}

export function getCourseOfferingRepository(): CourseOfferingService {
    if (!courseOfferingServiceInstance) {
        throw new Error("CourseOfferingRepository not initialized. Call initializeDependencies() first.");
    }
    return courseOfferingServiceInstance;
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