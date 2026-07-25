import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';
import { ClientRequirement } from './ClientRequirement';

export enum RequirementFrequency {
    ONE_TIME = "One Time",
    WEEKLY = "Weekly",
    MONTHLY = "Monthly",
    REGULAR = "Regular",
    CONTRACT = "Contract"
}

@Check(`frequency IN ('One Time', 'Weekly', 'Monthly', 'Regular', 'Contract') AND "approx_quantity" >= 0`)
@Entity('client_request_items')
export class ClientRequirementItem {
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ name: 'client_request_id', type: 'int' })
    clientRequirementId!: number;

    @ManyToOne(() => ClientRequirement, (request) => request.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'client_request_id' })
    clientRequirement!: ClientRequirement;

    @Column({ name: 'product_category', type: 'varchar', length: 100 })
    productCategory!: string;

    @Column({ name: 'product_name', type: 'varchar', length: 255 })
    productName!: string;

    @Column({ name: 'approx_quantity', type: 'decimal', precision: 10, scale: 2, default: 0.00 })
    approxQuantity!: number;

    @Column({ name: 'unit', type: 'varchar', length: 20 })
    unit!: string;

    @Column({ 
        type: 'varchar', 
        length: 20, 
        default: RequirementFrequency.ONE_TIME 
    })
    frequency!: RequirementFrequency;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
