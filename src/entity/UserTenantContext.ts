// src/entity/UserTenantContext.ts
import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique, PrimaryColumn } from 'typeorm';
import { User } from './User'; 
import { Tenant } from './Tenant'; 
import { UserRoleLookup } from './UserRoleLookup'; 

@Unique("UQ_UserTenantContext", ["userId", "tenantId", "roleName"]) 
@Entity({ name: 'UserTenantContext' })
export class UserTenantContext {
    @PrimaryColumn({ type: 'int' })
    userId!: number;

    @PrimaryColumn({ type: 'int' })
    tenantId!: number;  

    @ManyToOne(() => Tenant, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'tenantId', referencedColumnName: 'tenantId' }) 
    tenant!: Tenant;

    @PrimaryColumn({ type: 'nvarchar', length: 50, nullable: false, name: 'RoleName' })
    roleName!: string;

    @Column({ name: 'IsActiveInContext', type: 'bit', default: true })
    isActiveInContext!: boolean;

    @Column({ name: 'IsImpersonationContext', type: 'bit', default: false })
    isImpersonationContext!: boolean;

    @ManyToOne(() => User, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user!: User;

    @ManyToOne(() => UserRoleLookup, (role) => role.userTenantContexts, { onDelete: 'NO ACTION' })
    @JoinColumn([
        { name: 'tenantId', referencedColumnName: 'tenantId' }, 
        { name: 'RoleName', referencedColumnName: 'rolename' }  // 💡 FIX: Changed 'RoleName' to 'rolename' to match UserRoleLookup property
    ])
    role!: UserRoleLookup;

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}
