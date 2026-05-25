// src/entity/RolePermission.ts
import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserRoleLookup } from './UserRoleLookup';
import { Permission } from './Permission';

@Entity({ name: 'RolePermissions' }) // Explicit name for the junction table
export class RolePermission {
    // Composite Primary Key: Combination of roleName and permissionName
    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'RoleName' })
    roleName!: string;

    @PrimaryColumn({ type: 'nvarchar', length: 100, name: 'PermissionName' })
    permissionName!: string;

    // // ManyToOne relationship to UserRoleLookup
    // @ManyToOne(() => UserRoleLookup, role => role.rolePermissions, { onDelete: 'CASCADE' }) // Cascade delete if role is removed
    // @JoinColumn({ name: 'RoleName', referencedColumnName: 'rolename' })
    // role!: UserRoleLookup;

    // ManyToOne relationship to Permission
    @ManyToOne(() => Permission, permission => permission.roles, { onDelete: 'CASCADE' }) // Cascade delete if permission is removed
    @JoinColumn({ name: 'PermissionName', referencedColumnName: 'permissionName' })
    permission!: Permission;

    // You could add additional columns here if needed, e.g.:
    // @Column({ type: 'datetime2', default: () => 'GETDATE()' })
    // assignedAt!: Date;
    // @Column({ type: 'nvarchar', length: 255, nullable: true })
    // assignedByUserId?: string;
}