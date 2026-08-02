// src/entity/Tenant.ts - MODIFIED
import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User'; 
import { UserTenantContext } from './UserTenantContext'; 
import { TenantTypeLookup } from './TenantTypeLookup'; 
import { SubscriptionPlanLookup } from './SubscriptionPlanLookup'; 
import { Tenant_custom_scripts } from './Tenant_custom_scripts';
import { UserRoleLookup } from './UserRoleLookup';
import { TenantStrategy } from './TenantStrategy';
import { SalesOrder } from './SalesOrder';
import { Customer } from './Customer';
import { Product } from './Product';
import { Config } from './Config';
import { Vendor } from './Vendor';
import { City } from './city';
import { District } from './District';

@Entity({ name: 'Tenant' })
export class Tenant { 
    // --- MODIFIED: Changed from @PrimaryGeneratedColumn to allow manual 0 assignment ---
    @PrimaryColumn({ type: 'int', name: 'tenantId' })
    tenantId!: number;
    // --- END MODIFIED ---

    @Column({ type: 'nvarchar', length: 255, unique: true, name: 'tenantName' })
    tenantName!: string;

    @Column({ type: 'simple-json', nullable: true, name: 'AutocodeConfig' })
    autocodeConfig?: {
        faculty?: string; 
        student?: string; 
    }; 
    
    @Column({ type: 'nvarchar', length: 50, name: 'tenantType' }) 
    tenantTypeName!: string; 

    @ManyToOne(() => TenantTypeLookup, lookup => lookup.tenants)
    @JoinColumn({ name: 'tenantType' }) 
    tenantType!: TenantTypeLookup; 

    @OneToMany(() => Customer, (customer) => customer.tenant)
    customers!: Tenant_custom_scripts[];
    
    @OneToMany(() => Tenant_custom_scripts, (tcs) => tcs.tenant)
    tenantscripts!: Tenant_custom_scripts[];

    @OneToMany(() => Product, (product) => product.tenant)
    products!: Product[];

    @OneToMany(() => Vendor, (vendor) => vendor.tenant)
    vendors!: Vendor[];

    @OneToMany(() => City, (ct) => ct.tenant)
    citys!: City[];

    @OneToMany(()=>District,(dst) =>dst.tenant)
    districts!:District[];
  
    @OneToMany(() => Config, (config) => config.tenant)
    configs!: Product[];

    @OneToMany(() => UserRoleLookup, (url) => url.tenant)
    userrolelookups!: UserRoleLookup[];

    @OneToMany(() => User, (user) => user.tenant)
    users!: User[];

    @OneToMany(() => TenantStrategy, (tstrategy) => tstrategy.tenant)
    tenantstrategies!: TenantStrategy[];
  
    @Column({ type: 'nvarchar', length: 50, name: 'subscriptionPlan' }) 
    subscriptionPlanName!: string; 

    @ManyToOne(() => SubscriptionPlanLookup, lookup => lookup.tenants)
    @JoinColumn({ name: 'subscriptionPlan' }) 
    subscriptionPlan!: SubscriptionPlanLookup; 

    @Column({ type: 'datetime2', name: 'subscriptionEndDate', nullable: true })
    subscriptionEndDate?: Date | null;

    @Column({ type: 'bit', default: true, name: 'isActive' })
    isActive!: boolean;

    @CreateDateColumn({ type: 'datetime2', name: 'createdAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'updatedAt' })
    updatedAt!: Date;
} 
