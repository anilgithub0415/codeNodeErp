import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Check, Index } from 'typeorm';
import { ClientPurchaseOrderItem } from './ClientPurchaseOrderItem';

export enum POStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    SENT = "SENT",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    CLOSED = "CLOSED",
    CANCELLED = "CANCELLED"
}
@Check(`status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'CLOSED', 'CANCELLED')`)

//few more statuses://'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'PARTIALLY_CONVERTED';

@Entity("client_purchase_orders")
@Index(['tenantId', 'clientPoNumber'], { unique: true }) 
export class ClientPurchaseOrder {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ name: 'tenant_id', type: 'int' })
    tenantId!: number;


       @Column({ 
            type: "varchar", 
            length: 25, // Generous enough padding for your longest status string
            default: POStatus.DRAFT 
        })
        status!: POStatus;

    @Column({ name: 'client_id', type: 'int' })
    clientId!: number; 

    @Column({ name: 'client_po_number', type: 'varchar', length: 50 })
    clientPoNumber!: string; 

    @Column({ name: 'site_id', type: 'int', nullable: true })
siteId!: number | null; // 👈 Make sure this camelCase variable exists!

    @Column({ name: 'po_date', type: 'date' })
    poDate!: Date; 

    @Column({ name: 'requested_delivery_date', type: 'date', nullable: true })
    requestedDeliveryDate!: Date;

   

    @Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2, default: 0 })
    totalAmount!: number;

    @Column({ name: 'client_notes', type: 'nvarchar', length: 'MAX', nullable: true })
    clientNotes!: string; 

    @Column({ name: 'internal_notes', type: 'nvarchar', length: 'MAX', nullable: true })
    internalNotes!: string; 

    @Column({ name: 'converted_sales_order_id', type: 'int', nullable: true })
    convertedSalesOrderId!: number; 

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => ClientPurchaseOrderItem, (item) => item.clientPurchaseOrder, { cascade: true })
    items!: ClientPurchaseOrderItem[];
}
