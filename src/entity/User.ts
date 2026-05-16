import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, Unique, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { RefreshToken } from './RefreshToken';
import { Person } from './Person';
import { UserTenantContext } from './UserTenantContext'; // New import for context

@Unique("UQ_userName", ["userName"]) // userName is now globally unique across all tenants
@Entity({ name: 'User' })
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    // Removed tenantId from User entity. Tenant association is now via UserTenantContext.

    @Column({ name: 'userName', type: 'nvarchar', length: 255, unique: true }) // User's login email (globally unique)
    userName!: string;

    @Column({ name: 'displayName', type: 'nvarchar', length: 100, nullable: true })
    displayName?: string | null;
    
    @Column({ name: 'profilePictureUrl', type: 'nvarchar', length: 100, nullable: true })
    profilePictureUrl?: string | null;

    @Column({ name: 'password', type: 'nvarchar', length: 255, nullable: true })
    password?: string | null;

    // Removed direct 'role' column/relationship. Roles are now via UserTenantContext.

    @Column({ name: 'isActive', type: 'bit', default: true })
    isActive!: boolean;

    @Column({ name: 'isEmailVerified', type: 'bit', default: false })
    isEmailVerified?: boolean;

    @Column({ name: 'verificationToken', type: 'nvarchar', length: 255, nullable: true })
    verificationToken?: string | null;

    @Column({ name: 'verificationTokenExpiresAt', type: 'datetime2', nullable: true })
    verificationTokenExpiresAt?: Date | null;

    @Column({ name: 'googleId', type: 'nvarchar', length: 255, nullable: true })
    googleId?: string | null;

    @Column({ type: 'int', nullable: true, name: 'CreatedByUserId' })
    createdByUserId?: number | null;

    @ManyToOne(() => User, user => user.createdUsers, { nullable: true, onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'CreatedByUserId' })
    createdBy?: User | null;

    @OneToMany(() => User, user => user.createdBy)
    createdUsers?: User[];

    // --- One-to-One relationship with Person (personId is UNIQUE) ---
    // @Column({ type: 'int', unique: true, nullable: false, name: 'PersonId' })
    // personId!: number;

    // @OneToOne(() => Person, person => person.user, { nullable: false, onDelete: 'CASCADE' }) // If user is deleted, person is deleted
    // @JoinColumn({ name: 'PersonId' })
    // person!: Person;
    // --- END One-to-One ---

    // --- NEW: One-to-Many relationship with UserTenantContext ---
    // A global user can have many contexts (tenant + role combinations)
    @OneToMany(() => UserTenantContext, userTenantContext => userTenantContext.user)
    userTenantContexts?: UserTenantContext[];
    // --- END NEW ---

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;

    @OneToMany(() => RefreshToken, refreshToken => refreshToken.user)
    refreshTokens?: RefreshToken[];
}