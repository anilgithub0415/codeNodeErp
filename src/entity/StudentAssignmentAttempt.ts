import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { StudentProfile } from './StudentProfile'; // Import StudentProfile entity

import { User } from './User'; // For gradedByUserId
import { StudentAnswer } from './StudentAnswer'; // For inverse relationship (answers for this attempt)

@Entity({ name: 'StudentAssignmentAttempt' })
export class StudentAssignmentAttempt {
    @PrimaryGeneratedColumn()
    id!: number;

    // Many-to-One relationship with StudentProfile (who made this attempt)
    @Column({ type: 'int', nullable: false, name: 'StudentProfileId' })
    studentProfileId!: number;


    @Column({ type: 'datetime2', nullable: false })
    startTime!: Date; // When the student started the attempt

    @Column({ type: 'datetime2', nullable: true })
    endTime?: Date | null; // When the student finished/submitted (can be null if still active)

    @Column({ type: 'datetime2', nullable: true })
    submissionTime?: Date | null; // Exact time of submission (might differ from endTime if system-forced)

    @Column({ type: 'nvarchar', length: 50, nullable: false, default: 'Started' })
    status!: string; // e.g., 'Started', 'Submitted', 'Graded', 'Timeout'

    @Column({ type: 'decimal', precision: 7, scale: 2, nullable: true })
    score?: number | null; // Total score obtained in this attempt

    @Column({ type: 'int', nullable: true })
    timeTakenSeconds?: number | null; // Duration of the attempt in seconds

    // Many-to-One relationship with User (the Faculty/Admin who graded this attempt, if manual grading)
    @Column({ type: 'int', nullable: true, name: 'GradedByUserId' })
    gradedByUserId?: number | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'GradedByUserId' })
    gradedBy?: User | null;

    // --- Relationships ---

    // One-to-Many relationship with StudentAnswer (many answers belong to one attempt)
    @OneToMany(() => StudentAnswer, studentAnswer => studentAnswer.studentAssignmentAttempt)
    studentAnswers?: StudentAnswer[];

    // Audit fields
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}