/** Use below code for SuperAdmin pretending 
 * // Example authorization step inside your authentication service
async function startImpersonationSession(superAdminId: number, targetTenantId: number, targetRole: string) {
    // 1. Verify that the requesting user is a legitimate SuperAdmin in global context (TenantId: 1 or NULL)
    const isAdmin = await userRepository.findOne({ where: { id: superAdminId, tenantId: 1 } });
    if (!isAdmin) throw new Error("Unauthorized access request");

    // 2. Build the Payload reflecting the target tenant & target role constraints
    const impersonationPayload = {
        userId: superAdminId,          // Real identity remains intact for auditing logs
        tenantId: targetTenantId,      // Swapped target tenant context
        activeRole: targetRole,        // Swapped target role view context
        isImpersonating: true          // Flags frontend to show warning ribbons
    };

    // 3. Generate short-lived JWT token containing this custom payload configuration
    return jwt.sign(impersonationPayload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

We need 2 things from SuperAdmin login  
1.Stage 1: Global Management Mode (The Default Login)
2.Stage 2: Impersonation Mode (The Switch)

*/
// src/entity/User.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Tenant } from './Tenant';

@Entity({ name: 'User' })
export class User {
    @PrimaryGeneratedColumn('increment')
    id!: number;
        
    // 🔀 CHANGE: Made nullable to support global system contexts / SuperAdmins
    @Column('int', { nullable: true })
    tenantId!: number | null;
    
    // 🔀 CHANGE: Made nullable: true to align with the column change
    @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId', referencedColumnName: 'tenantId' })
    tenant!: Tenant | null; 

    @Column({ name: 'userName', type: 'nvarchar', length: 255 }) 
    userName!: string;
    
    @Column({ name: 'displayName', type: 'nvarchar', length: 100, nullable: true })
    displayName?: string | null;
    
    @Column({ name: 'profilePictureUrl', type: 'nvarchar', length: 100, nullable: true })
    profilePictureUrl?: string | null;

    @Column({ name: 'password', type: 'nvarchar', length: 255, nullable: true })
    password?: string | null;

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

    @Index("IX_User_siteId", ["siteId"])     
    @Column({ type: 'int', nullable: true, name: 'SiteId' })
    siteId?: number | null;

    @ManyToOne('Site', 'users', { nullable: true, onDelete: 'SET NULL' }) 
    @JoinColumn({ name: 'SiteId' })
    site?: any;

    @Index("IX_User_clientId", ["clientId"]) 
    @Column({ type: 'int', nullable: true, name: 'ClientId' })
    clientId?: number | null;

    @ManyToOne('Customer', 'users', { nullable: true }) 
    @JoinColumn({ name: 'ClientId' })
    client?: any;

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}
