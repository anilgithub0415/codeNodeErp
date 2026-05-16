import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Question } from './Question'; // Import the Question entity

@Entity({ name: 'QuestionPurposeLookup' })
export class QuestionPurposeLookup {
    // The primary key for the lookup table, storing values like 'Homework', 'Quiz', etc.
    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'PurposeName' })
    purposeName!: string; 

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    description?: string | null;
    
    @Column({ type: 'bit', default: true })  
    isActive!: boolean; 

    // One-to-Many relationship with the Question entity
    // This allows you to find all questions associated with a specific purpose.
    @OneToMany(() => Question, question => question.questionPurpose)
    Questions?: Question[];

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}