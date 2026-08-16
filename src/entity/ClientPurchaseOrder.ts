import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Check, Index } from 'typeorm';
import { ClientPurchaseOrderItem } from './ClientPurchaseOrderItem';

export enum Client_POStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    SENT = "SENT",
    PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED",
    FULFILLED ='FULFILLED',
    CLOSED = "CLOSED", 
    CANCELLED = "CANCELLED"
}
@Check(`status IN ('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CLOSED', 'CANCELLED')`)

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
            default: Client_POStatus.DRAFT 
        })
        status!: Client_POStatus;

    @Column({ name: 'client_id', type: 'int' })
    clientId!: number|null; 

    @Column({ name: 'client_po_number', type: 'varchar', length: 50 })
    clientPoNumber!: string  | null; 

    @Column({ name: 'site_id', type: 'int', nullable: true })
siteId!: number | null; // 👈 Make sure this camelCase variable exists!

    @Column({ name: 'po_date', type: 'date' })
    poDate!: Date | null; 

    @Column({ name: 'requested_delivery_date', type: 'datetime', nullable: true })
    requestedDeliveryDate!: Date | null;

   

    @Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2, default: 0 })
    totalAmount!: number;

    @Column({ name: 'client_notes', type: 'nvarchar', length: 'MAX', nullable: true })
    clientNotes!: string; 

    @Column({ name: 'internal_notes', type: 'nvarchar', length: 'MAX', nullable: true })
    internalNotes!: string; 


    @Column({
        name: 'is_converted_to_sales',
        type: 'bit',
        default: false
    })
    isConvertedToSales!: boolean;

    @Column({ name: 'converted_sales_order_id', type: 'int', nullable: true })
    convertedSalesOrderId!: number | null;
  
    @Column({
    name: 'converted_sales_order_number',
    type: 'varchar',
    length: 50,
    nullable: true
    })
    convertedSalesOrderNumber!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => ClientPurchaseOrderItem, (item) => item.clientPurchaseOrder, { cascade: true })
    items!: ClientPurchaseOrderItem[];
}
