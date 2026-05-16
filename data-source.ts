// src/data-source.ts
import 'reflect-metadata'; // Required for TypeORM decorators
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/entity/User'; // Import your User entity
import {Settings} from './src/entity/Settings'
import {RefreshToken} from './src/entity/RefreshToken'
import { refreshTokens } from './src/memory/memoryStore';
import { Tenant } from './src/entity/Tenant';
import { TenantTypeLookup} from './src/entity/TenantTypeLookup';
import { SubscriptionPlanLookup} from './src/entity/SubscriptionPlanLookup';
import { UserRoleLookup } from './src/entity/UserRoleLookup';
//import { RolePermission } from './src/entity/RolePermission';
import { Permission } from './src/entity/Permission';
import { TenantQuestion } from './src/entity/TenantQuestion';
import { Question } from './src/entity/Question';
import { QuestionTypeLookup } from './src/entity/QuestionTypeLookup';
import { Subject } from './src/entity/Subject';
import { Course } from './src/entity/Course';
import { Program } from './src/entity/Program';
import { StudentProfile } from './src/entity/StudentProfile';
import { Person } from './src/entity/Person';
import { StudentAssignmentAttempt } from './src/entity/StudentAssignmentAttempt';
import { Assignment } from './src/entity/Assignment';
import { CourseOffering } from './src/entity/CourseOffering';
import { Enrollment } from './src/entity/Enrollment';
import { AssignmentQuestion } from './src/entity/AssignmentQuestion';
import { StudentAnswer } from './src/entity/StudentAnswer';
import { Topic } from './src/entity/Topic';
import { ExamType } from './src/entity/ExamType';
import { QuestionCategoryLookup } from './src/entity/QuestionCategoryLookup';
import { Option } from './src/entity/Option';
import { UserTenantContext } from './src/entity/UserTenantContext';
import { FacultyProfile } from './src/entity/FacultyProfile';
import { AssignmentAttempt } from './src/entity/AssignmentAttempt';
import { StudentQuestionAnswer } from './src/entity/StudentQuestionAnswer';
import { QuestionExamTypes } from './src/entity/QuestionExamTypes';
import { ProgramCourses } from './src/entity/ProgramCourses';
import { StudentCourseOffering } from './src/entity/StudentCourseOffering';
import { AutocodeCounter } from './src/entity/AutocodeCounter';
import { QuestionPurposeLookup } from './src/entity/QuestionPurposeLookup';



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
    entities: [Tenant,TenantTypeLookup,SubscriptionPlanLookup,User,UserRoleLookup,Permission,RefreshToken,Settings
    ,TenantQuestion,Question,QuestionTypeLookup,Subject,Course,Program,StudentProfile,Person,StudentAssignmentAttempt,Assignment
    ,CourseOffering,Enrollment,AssignmentQuestion,StudentAnswer,Topic,ExamType,QuestionCategoryLookup,Option
,UserTenantContext,Program,ExamType,Question,CourseOffering
,FacultyProfile,AssignmentAttempt,StudentQuestionAnswer,QuestionExamTypes,ProgramCourses,QuestionCategoryLookup
 ,Enrollment,StudentCourseOffering ,AutocodeCounter,ProgramCourses, QuestionPurposeLookup], // Register your entities here
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