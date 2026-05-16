import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';


@Entity({ name: 'Option' })
export class Option {
    @PrimaryGeneratedColumn()
    id!: number;


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