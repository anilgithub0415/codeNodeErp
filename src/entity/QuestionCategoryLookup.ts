import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AssignmentQuestion } from './AssignmentQuestion'; // NEW: Import AssignmentQuestion entity
import { Question } from './Question';

@Entity({ name: 'QuestionCategoryLookup' })
export class QuestionCategoryLookup {
    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'CategoryName' })
    categoryName!: string; 

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    description?: string | null;
   
    @Column({ type: 'bit', default: true })  
    isActive!: boolean; 

    // --- NEW: One-to-Many relationship with AssignmentQuestion ---
    @OneToMany(() => Question, question => question.questionCategory)
    Questions?: Question[];
    // --- END NEW ---

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}