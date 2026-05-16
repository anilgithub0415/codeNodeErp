import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { User } from './User'; // Global User
import { Tenant } from './Tenant'; // Specific Tenant
import { UserRoleLookup } from './UserRoleLookup'; // Role within that tenant

// A user can have only one specific role within a specific tenant context
// If a user can have MULTIPLE roles within a single tenant, this table would need to be UserTenantRoleContext
// and link to a separate UserRoleLookup, and the unique constraint would be (userId, tenantId, roleId).
// For now, assuming one primary role per user per tenant context.
@Unique("UQ_UserTenantContext", ["userId", "tenantId", "roleName"]) // Ensures a user has a unique role in a given tenant
@Entity({ name: 'UserTenantContext' })
export class UserTenantContext {
    @PrimaryGeneratedColumn()
    id!: number;

    // Many-to-One relationship with User (the global login account)
    @Column({ type: 'int', nullable: false, name: 'UserId' })
    userId!: number;

    @ManyToOne(() => User, user => user.userTenantContexts, { onDelete: 'CASCADE' }) // If user is deleted, contexts are deleted
    @JoinColumn({ name: 'UserId' })
    user!: User;

    // Many-to-One relationship with Tenant
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.userTenantContexts, { onDelete: 'CASCADE' }) // If tenant is deleted, contexts are deleted
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;

    // Many-to-One relationship with UserRoleLookup (the role within this context)
    @Column({ type: 'nvarchar', length: 50, nullable: false, name: 'RoleName' })
    roleName!: string;

    //RESTRICT was not working so replaced by CASCADE                            <!--RESTRICT-->
    @ManyToOne(() => UserRoleLookup, role => role.userTenantContexts, { onDelete: 'CASCADE' }) // Prevent deleting a role if it's in use // RESTRICT
    @JoinColumn({ name: 'RoleName', referencedColumnName: 'rolename' })
    role!: UserRoleLookup;

    @Column({ type: 'bit', default: true })
    isActiveInContext!: boolean; // Is this specific role for this user in this tenant active?

    // Audit fields
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}