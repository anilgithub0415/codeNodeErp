import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity({ name: 'AutocodeCounter' })
@Unique(['tenantId', 'type']) // Ensures a unique counter for each tenant+type combination
export class AutocodeCounter {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({type:'int'})
    tenantId!:number;

    @Column({ type: 'nvarchar', length: 50, nullable: false })
    type!: string; // 'faculty', 'student', etc.

    @Column({ type: 'int', default: 0 })
    currentValue!: number;
}