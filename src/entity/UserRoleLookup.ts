import { Entity, PrimaryColumn, Column, OneToMany, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserTenantContext } from './UserTenantContext'; // Import UserTenantContext entity
import { Permission } from './Permission'; // Import Permission entity

@Entity({ name: 'UserRoleLookup' })
export class UserRoleLookup {
    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'RoleName' })
    rolename!: string;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    description?: string | null;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    // --- NEW: One-to-Many relationship with UserTenantContext ---
    // A role can be part of many user-tenant contexts
    @OneToMany(() => UserTenantContext, userTenantContext => userTenantContext.role)
    userTenantContexts?: UserTenantContext[];
    // --- END NEW ---

    // --- Many-to-Many relationship with Permission ---
    // Many roles can have many permissions (via RolePermissions junction table)
    @ManyToMany(() => Permission, permission => permission.roles, { eager: true }) // Eager load permissions for roles
    @JoinTable({
        name: 'RolePermissions', // Name of the junction table for UserRoleLookup <-> Permission
        joinColumn: { name: 'RoleName', referencedColumnName: 'rolename' }, // Column in junction table pointing to UserRoleLookup
        inverseJoinColumn: { name: 'PermissionName', referencedColumnName: 'permissionName' } // Column in junction table pointing to Permission
    })
    permissions?: Permission[];
    // --- END Many-to-Many ---

    // Audit fields
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}