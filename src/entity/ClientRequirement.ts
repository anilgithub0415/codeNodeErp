import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Check, ManyToOne, JoinColumn } from 'typeorm';
import { ClientRequirementItem } from './ClientRequirementItem';
import { Customer } from './Customer'; // Import Customer entity

@Check(`"monthly_budget" >= 0 AND "expected_budget" >= 0`)
@Entity("client_requests")
export class ClientRequirement {
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: 'int' })
    tenantId!: number;

    // 1. Foreign Key Column
    @Column({ name: 'client_id', type: 'int' })
    clientId!: number;

    // 2. ManyToOne Relationship Mapping
    @ManyToOne(() => Customer, { onDelete: 'CASCADE' }) // Change to 'NO ACTION' if restriction is needed
    @JoinColumn({ name: 'client_id' })
    client!: Customer;

    @Column({ name: 'special_requirement', type: 'nvarchar', length: 'MAX', nullable: true })
    specialRequirement!: string | null;

    @Column({ name: 'packing_requirement', type: 'nvarchar', length: 'MAX', nullable: true })
    packingRequirement!: string | null;

    @Column({ name: 'delivery_requirement', type: 'nvarchar', length: 'MAX', nullable: true })
    deliveryRequirement!: string | null;

    @Column({ name: "expected_budget", type: "decimal", precision: 12, scale: 2, default: 0.00 })
    expectedBudget!: number;

    @Column({ name: "monthly_budget", type: "decimal", precision: 12, scale: 2, default: 0.00 })
    monthlyBudget!: number;

    @Column({ name: 'remarks_notes', type: 'nvarchar', length: 'MAX', nullable: true })
    remarksNotes!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => ClientRequirementItem, (item: ClientRequirementItem) => item.clientRequirement, { cascade: true })
    items!: ClientRequirementItem[];
}
