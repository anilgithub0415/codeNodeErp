import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, Unique, CreateDateColumn, UpdateDateColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { RefreshToken } from './RefreshToken';

import { UserTenantContext } from './UserTenantContext'; // New import for context
import { Tenant } from './Tenant';
  // src/entity/User.ts
import { Site } from './Site'; 
import { Customer } from './Customer';
// 1. Define a composite unique constraint combining tenant and username
@Unique("UQ_tenant_userName", ["tenantId", "userName"]) 
@Entity({ name: 'User' })
export class User {
    @PrimaryGeneratedColumn('increment')
    id!: number;
        
    @Column('int')
    tenantId!: number;
    
    @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant; 
    // 2. Remove "unique: true" from here so it is not globally locked
    @Column({ name: 'userName', type: 'nvarchar', length: 255 }) 
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

  

// ... inside your User class definition:

    @Column({ type: 'int', nullable: true, name: 'SiteId' })
    siteId?: number | null; // 👈 Raw foreign key integer column

    
    @ManyToOne(() => Site, { nullable: true, onDelete: 'CASCADE' }) // 👈 Relational link
    @JoinColumn({ name: 'SiteId' })
    site?: Site | null;

    @Column({ type: 'int', nullable: true, name: 'ClientId' })
    clientId?: number | null; // 👈 Raw foreign key integer column

    @ManyToOne(() => Customer, { nullable: true, onDelete: 'CASCADE' }) // 👈 Relational link
    @JoinColumn({ name: 'ClientId' })
    client?: Customer | null;

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;

    // @OneToMany(() => RefreshToken, refreshToken => refreshToken.user)
}

/*
payload will be
{
  "userId": 109,
  "tenantId": 1,
  "role": "SitePortalUser",
  "siteId": 52 
}
 */
/*// ❌ UNSAFE: Trusting the client UI input
const siteId = req.query.siteId; 
const orders = await orderRepo.find({ where: { siteId } });

//  SECURE: Hard-locking to the Token Context
const siteId = req.user.siteId; // Extracted straight from the verified JWT
const orders = await orderRepo.find({ where: { siteId } }); 
 */