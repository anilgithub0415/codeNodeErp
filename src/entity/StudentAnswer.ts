import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { StudentAssignmentAttempt } from './StudentAssignmentAttempt'; // Import StudentAssignmentAttempt entity
import { Option } from './Option'; // For selected options in MCQs

// Composite unique index to ensure a student answers a question only once per attempt
@Unique("UQ_StudentAnswer", ["studentAssignmentAttemptId", "questionId"])
@Entity({ name: 'StudentAnswer' })
export class StudentAnswer {
    @PrimaryGeneratedColumn()
    id!: number;

    // Many-to-One relationship with StudentAssignmentAttempt
    @Column({ type: 'int', nullable: false, name: 'StudentAssignmentAttemptId' })
    studentAssignmentAttemptId!: number;

    @ManyToOne(() => StudentAssignmentAttempt, attempt => attempt.studentAnswers, { onDelete: 'CASCADE' }) // If attempt is deleted, answers are deleted
    @JoinColumn({ name: 'StudentAssignmentAttemptId' })
    studentAssignmentAttempt!: StudentAssignmentAttempt;


    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    studentAnswerText?: string | null; // For descriptive or numerical answers

    // For MCQ questions: store selected option IDs as a JSON string or an array if your DB supports it
    // If your DB supports JSON/JSONB, use type: 'json' or 'jsonb'
    // Otherwise, store as a comma-separated string or create a separate junction table (StudentAnswerOption)
    @Column({ type: 'nvarchar', length: 500, nullable: true }) // Store as comma-separated IDs "1,5,7" or JSON string "[1,5,7]"
    selectedOptionIds?: string | null; // e.g., for multi-correct MCQs

    // Many-to-Many relationship with Option if you want explicit links (more complex)
    // @ManyToMany(() => Option)
    // @JoinTable({
    //     name: 'StudentAnswerOptions',
    //     joinColumn: { name: 'StudentAnswerId', referencedColumnName: 'id' },
    //     inverseJoinColumn: { name: 'OptionId', referencedColumnName: 'id' }
    // })
    // selectedOptions?: Option[];

    @Column({ type: 'bit', nullable: true }) // Nullable if not yet graded/auto-graded
    isCorrect?: boolean | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) // Marks obtained for this specific answer
    marksObtained?: number | null;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    feedback?: string | null; // Feedback for descriptive answers

    // Audit fields
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}