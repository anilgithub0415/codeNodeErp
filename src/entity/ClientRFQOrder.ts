import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Check, Index } from 'typeorm';
import { ClientRFQOrderItem } from './ClientRFQOrderItem';

export enum RFQStatus {
    DRAFT = "DRAFT",                     // Client is writing the request
    SUBMITTED = "SUBMITTED",             // Client dispatched it to wholesalers (Replaces SENT)
    
    // --- Processing States ---
    PARTIALLY_QUOTED = "PARTIALLY_QUOTED", // Some items linked to a SENT/APPROVED Quote
    QUOTED = "QUOTED",                   // All items linked to a SENT/APPROVED Quote
    IN_NEGOTIATION = "IN_NEGOTIATION",   // Linked Quote is currently COUNTER_OFFERED/REVISED
    
    // --- Terminal States ---
    CLOSED = "CLOSED",                   // Successfully converted to an Order/Contract
    CANCELLED = "CANCELLED"              // Client withdrew the request entirely
}
@Check(`status IN ('DRAFT', 'SUBMITTED',  'PARTIALLY_QUOTED', 'QUOTED', 'IN_NEGOTIATION', 'CLOSED', 'CANCELLED')`)


@Entity("client_rfq_orders")
@Index(['tenantId', 'clientRFQNumber'], { unique: true }) 
export class ClientRFQOrder {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ name: 'tenant_id', type: 'int' })
    tenantId!: number;


       @Column({ 
            type: "varchar", 
            length: 25, // Generous enough padding for your longest status string
            default: RFQStatus.DRAFT 
        })
        status!: RFQStatus;

    @Column({ name: 'client_id', type: 'int' })
    clientId!: number; 

    @Column({ name: 'client_rfq_number', type: 'varchar', length: 50 })
    clientRFQNumber!: string; 

    @Column({ name: 'site_id', type: 'int', nullable: true })
siteId!: number | null; // 👈 Make sure this camelCase variable exists!

    @Column({ name: 'rfq_date', type: 'date' })
    rfqDate!: Date; 

    @Column({ name: 'requested_delivery_date', type: 'date', nullable: true })
    requestedDeliveryDate!: Date;

   

    @Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2, default: 0 })
    totalAmount!: number;

    @Column({ name: 'client_notes', type: 'nvarchar', length: 'MAX', nullable: true })
    clientNotes!: string; 

    @Column({ name: 'internal_notes', type: 'nvarchar', length: 'MAX', nullable: true })
    internalNotes!: string; 

   @Column({
    default: false
    })
    isConvertedToQuotation!: boolean;

    @Column({
        name: 'converted_quotation_id', 
        type: 'int', 
        nullable: true
    })
    convertedQuotationId!: number | null;

    @Column({
        name: 'converted_quotation_number',
        type: 'varchar',
        length: 50,
        nullable: true
    })
    convertedQuotationNumber!: string | null; 

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
@OneToMany(
    () => ClientRFQOrderItem,
    item => item.clientRFQOrder,
    {
        cascade: true,
        orphanedRowAction: "delete"
    }
)
    items!: ClientRFQOrderItem[];
}
