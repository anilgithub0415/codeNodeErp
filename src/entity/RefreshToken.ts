// src/entity/RefreshToken.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User'; // Import User entity

@Entity({ name: 'RefreshToken' })
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id!: number;

   
    // Foreign Key to the User entity (this refers to the `User.id`)
    @Column({type:'int'})
    userId!: number; // Make sure this column name matches the actual column name for the FK
    
    // @ManyToOne(() => User, user => user.refreshTokens)
    // @JoinColumn({ name: 'userId' }) // Link to the 'userId' column in RefreshToken table
    // user!: User; // Relationship property to access the User object

 @Column({ type: 'nvarchar', length: 255, unique: true })
    token!: string;
 
    @Column({ type: 'datetime2' })
    expiresAt!: Date;
 
    @Column({ type: 'nvarchar', length: 255, nullable: true })
    deviceInfo?: string | null;
} 