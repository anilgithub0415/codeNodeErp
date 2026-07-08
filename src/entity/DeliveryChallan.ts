import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { SalesOrder } from './SalesOrder';
import { DeliveryChallanItem } from './DeliveryChallanItem';

@Entity("delivery_challans")
export class DeliveryChallan {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: 'int' })
    tenantId!: number;

    @Column()
    dcNumber!: string; // e.g., DC-2026-0001

    @Column({ name: 'sales_order_id' })
    salesOrderId!: number;

    @ManyToOne(() => SalesOrder, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "sales_order_id" })
    salesOrder!: SalesOrder;

    @Column()
    customerId!: number;

    @Column({ default: 'dispatched' }) // dispatched, delivered, cancelled
    status!: string;

    @Column({ type: 'varchar', nullable: true })
    vehicleNumber!: string | null;

    @Column({ type: 'varchar', nullable: true })
    transporterName!: string | null;

    // @Column({ type: 'timestamp', nullable: true })
    // dispatchDate!: Date;
@Column({ type: 'datetime2' }) // Do NOT use 'timestamp'
dispatchDate!: Date;

    @OneToMany(() => DeliveryChallanItem, (item) => item.deliveryChallan, { cascade: true })
    items!: DeliveryChallanItem[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
