// src/entity/UserRoleLookup.ts
import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserTenantContext } from './UserTenantContext'; 
import { RolePermission } from './RolePermission'; 
import { Tenant } from './Tenant';

@Entity({ name: 'UserRoleLookup' })
export class UserRoleLookup {
    @PrimaryColumn({ type: 'int', name: 'tenantId' })
    tenantId!: number;
        
    @ManyToOne(() => Tenant, (tenant) => tenant.userrolelookups, { onDelete: "NO ACTION" })
    @JoinColumn({ name: "tenantId", referencedColumnName: "tenantId" })
    tenant!: Tenant;

    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'RoleName' })
    rolename!: string;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    description?: string | null;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    @OneToMany(() => UserTenantContext, userTenantContext => userTenantContext.role)
    userTenantContexts?: UserTenantContext[];

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
    rolePermissions?: RolePermission[];

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}
