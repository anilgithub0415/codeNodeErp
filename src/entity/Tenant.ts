// src/entity/Tenant.ts - MODIFIED
import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User'; // Import User entity
import { UserTenantContext } from './UserTenantContext'; 
import { TenantTypeLookup } from './TenantTypeLookup'; // NEW: Import TenantTypeLookup
import { SubscriptionPlanLookup } from './SubscriptionPlanLookup'; // NEW: Import SubscriptionPlanLookup
import { TenantQuestion } from './TenantQuestion';


import { Enrollment } from './Enrollment';
import { StudentProfile } from './StudentProfile';
import { FacultyProfile } from './FacultyProfile';





import { Topic } from './Topic';
import { QuestionExamTypes } from './QuestionExamTypes';
import { ExamType } from './ExamType';
import { StudentQuestionAnswer } from './StudentQuestionAnswer';
import { StudentCourseOffering } from './StudentCourseOffering';

// REMOVE these enums from here, they are now represented by lookup tables
// export enum TenantType { /* ... */ }
// export enum SubscriptionPlan { /* ... */ }

@Entity({ name: 'Tenant' })
export class Tenant { 
    @PrimaryColumn({ type: 'nvarchar', length: 255, name: 'tenantId' })
    tenantId!: string;

    @Column({ type: 'nvarchar', length: 255, unique: true, name: 'tenantName' })
    tenantName!: string;

    // --- NEW: Autocode configuration column ---
    @Column({ type: 'simple-json', nullable: true, name: 'AutocodeConfig' })
    autocodeConfig?: {
        faculty?: string; // e.g., 'FAC-{YYYY}-{NNNN}'
        student?: string; // e.g., 'STU-{YYYY}-{NNNN}'
        // Add other roles or entities here as needed
    };
    // --- END NEW ---
    
    // --- MODIFIED: ManyToOne relationship to TenantTypeLookup ---
    @Column({ type: 'nvarchar', length: 50, name: 'tenantType' }) // This column stores the TypeName string
    tenantTypeName!: string; // Renamed to tenantTypeName to avoid conflict with relation property

    @ManyToOne(() => TenantTypeLookup, lookup => lookup.tenants)
    @JoinColumn({ name: 'tenantType' }) // Foreign key column name in Tenant table
    tenantType!: TenantTypeLookup; // This property now holds the actual TenantTypeLookup object
    // --- END MODIFIED ---

    // --- MODIFIED: ManyToOne relationship to SubscriptionPlanLookup ---
    @Column({ type: 'nvarchar', length: 50, name: 'subscriptionPlan' }) // This column stores the PlanName string
    subscriptionPlanName!: string; // Renamed to subscriptionPlanName to avoid conflict with relation property

    @ManyToOne(() => SubscriptionPlanLookup, lookup => lookup.tenants)
    @JoinColumn({ name: 'subscriptionPlan' }) // Foreign key column name in Tenant table
    subscriptionPlan!: SubscriptionPlanLookup; // This property now holds the actual SubscriptionPlanLookup object
    // --- END MODIFIED ---

    @Column({ type: 'datetime2', name: 'subscriptionEndDate', nullable: true })
    subscriptionEndDate?: Date | null;

    @Column({ type: 'bit', default: true, name: 'isActive' })
    isActive!: boolean;

    @CreateDateColumn({ type: 'datetime2', name: 'createdAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'updatedAt' })
    updatedAt!: Date;


    
    @OneToMany(() => Enrollment, enrollment => enrollment.tenant)
    enrollments?: Enrollment[];

    //
    @OneToMany(() => StudentProfile, studentprofile => studentprofile.tenant)
    studentProfiles?: StudentProfile[];

    @OneToMany(() => FacultyProfile, facultyprofile => facultyprofile.tenant)
    facultyProfiles?: FacultyProfile[];
    
   
    
    //

    //

    //
    //
    @OneToMany(() => ExamType, examtype => examtype.tenant)
    questionExamTypes?: ExamType[];

    //
    @OneToMany(() => QuestionExamTypes, questionexamtype => questionexamtype.tenant)
    examTypes?: QuestionExamTypes[];

    //
    // @OneToMany(() => StudentQuestionAnswer, studentquestionanswer => studentquestionanswer.tenant)
    // studentQuestionAnswers?: StudentQuestionAnswer[];
    @OneToMany(() => StudentQuestionAnswer, sqa => sqa.tenant)
    studentQuestionAnswers?: StudentQuestionAnswer[];
   

    @OneToMany(() => Topic, topic => topic.tenant)
    topics?: Topic[];

    // --- NEW: One-to-Many relationship with UserTenantContext ---
    // A tenant can have many user-tenant contexts
    @OneToMany(() => UserTenantContext, userTenantContext => userTenantContext.tenant)
    userTenantContexts?: UserTenantContext[];
    // --- END NEW ---
    // --- NEW: One-to-Many relationship with TenantQuestion ---
    // A tenant can have many custom/extended questions
    @OneToMany(() => TenantQuestion, tenantQuestion => tenantQuestion.tenant)
    tenantQuestions?: TenantQuestion[];
    // --- END NEW ---
    @OneToMany(() => StudentCourseOffering, sco => sco.tenant)
    studentCourseOfferings?: StudentCourseOffering[];
   
}