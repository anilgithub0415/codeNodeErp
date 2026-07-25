// src/entity/RolePermission.ts
import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserRoleLookup } from './UserRoleLookup';
import { Permission } from './Permission';

@Entity({ name: 'RolePermissions' }) 
export class RolePermission {
    @PrimaryColumn({ type: 'int', default: 1, name: 'tenantId' })
    tenantId!: number;

    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'RoleName' })
    roleName!: string;

    @PrimaryColumn({ type: 'nvarchar', length: 255, name: 'PermissionName' })
    permissionName!: string;

    @ManyToOne(() => UserRoleLookup, role => role.rolePermissions, { onDelete: 'NO ACTION' }) 
    @JoinColumn([
        { name: 'tenantId', referencedColumnName: 'tenantId' },
        { name: 'RoleName', referencedColumnName: 'rolename' } 
    ])
    role!: UserRoleLookup;

    @ManyToOne(() => Permission, permission => permission.rolePermissions, { onDelete: 'NO ACTION' })
    @JoinColumn([
        { name: 'tenantId', referencedColumnName: 'tenantId' },
        { name: 'PermissionName', referencedColumnName: 'permissionName' }
    ])
    permission!: Permission;
}
