// src/entity/Permission.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { RolePermission } from './RolePermission'; 

@Entity({ name: 'Permission' })
@Index(['tenantId', 'permissionName'], { unique: true }) 
export class Permission {
    @PrimaryGeneratedColumn() 
    id!: number;

    @Column({ type: 'int', default: 1, name: 'tenantId' })
    tenantId!: number;

    @Column({ type: 'nvarchar', length: 255, name: 'PermissionName' })
    permissionName!: string; 

    @Column({ type: 'nvarchar', length: 500, nullable: true })
    description?: string | null;

    @Column({ type: 'bit', default: true })  
    isActive!: boolean;

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
    rolePermissions?: RolePermission[];

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}
