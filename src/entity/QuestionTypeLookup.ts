import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';



@Entity({ name: 'QuestionTypeLookup' })
export class QuestionTypeLookup {
    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'TypeName' })
    typeName!: string;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    description?: string | null;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;


    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}