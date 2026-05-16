import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Question } from './Question'; // Import Question entity

@Entity({ name: 'Option' })
export class Option {
    @PrimaryGeneratedColumn()
    id!: number;

    // Many-to-One relationship with Question
    @Column({ type: 'int', nullable: false, name: 'QuestionId' })
    questionId!: number;

    @ManyToOne(() => Question, question => question.options, { onDelete: 'CASCADE' }) // If question is deleted, its options are deleted
    @JoinColumn({ name: 'QuestionId' })
    question!: Question;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: false })
    optionText!: string;

    @Column({ type: 'bit', nullable: false, default: false })
    isCorrect!: boolean;

    // Audit fields
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}