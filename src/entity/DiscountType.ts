import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { Tenant } from './Tenant';

export enum Discount_Types{
    PERCENTAGE ="PERCENTAGE",
    FIXED_AMOUNT = "FIXED_AMOUNT",
}
//there is no @check constraint bcos typename may be custom name

@Entity({ name: 'DiscountType' })
@Index(['tenantId', 'typeName'], { unique: true })
export class DiscountType {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    tenantId!: number;
      
    @ManyToOne(() => Tenant, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "tenantId" }) 
    tenant!: Tenant;

    // e.g. 'PERCENTAGE', 'FIXED_AMOUNT', or custom ones like 'BUY_X_GET_Y'
    @Column({ name: 'type_name', type: 'nvarchar', length: 30 })
    typeName!: string;

    @Column({ name: 'description', type: 'nvarchar', length: 100, nullable: true })
    description!: string | null;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    createdByUserId!: number;
}
