import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Check, ManyToOne, JoinColumn } from 'typeorm';
import { QuotationItem } from './QuotationItem';
import { Customer } from './Customer';

// 1. Define the negotiation status enum
export enum QuotationStatus {
    DRAFT = "DRAFT",                                     // Wholesaler creating the quote
    SENT = "SENT",                                       // Sent to client, visible in ClientPortal
    COUNTER_OFFERED = "COUNTER_OFFERED",                 // Client changed prices and sent back
    REVISED = "REVISED",                                 // Wholesaler adjusted prices based on counter-offer
    APPROVED = "APPROVED",                               // Client accepted (Ready to convert to Order/PO)
    REJECTED = "REJECTED",                               // Client or Wholesaler cancelled negotiation
    EXPIRED = "EXPIRED"                                  // Validity date passed
}

// 2. Add SQL Check constraint covering all enum values
@Check(`"total_amount" >= 0`)
@Check(`status IN ('DRAFT', 'SENT', 'COUNTER_OFFERED', 'REVISED', 'APPROVED', 'REJECTED', 'EXPIRED')`)
@Entity("quotations")
export class Quotation {
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: 'int' })
    tenantId!: number;

    @Column({ name: 'client_id', type: 'int' })
    clientId!: number;

    @ManyToOne(() => Customer, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'client_id' })
    client!: Customer;

    @Column({ name: 'client_name', type: 'nvarchar', length: 150 })
    clientName!: string;

    // 3. Add the status column mapped to the enum
    @Column({ 
        type: "varchar", 
        length: 25, 
        default: QuotationStatus.DRAFT 
    })
    status!: QuotationStatus;

    // Inside your Quotation Entity Class file
    @Column({ name: 'originating_client_rfq_id', type: 'int', nullable: true })
    originatingClientRfqId!: number | null;

    // 4. Threading fields to manage multi-round iterations
    @Column({ name: 'quote_number', type: 'varchar', length: 50, nullable: true })
    quoteNumber!: string; // e.g., "QT-2026-0001" (Shared across all revision iterations)

    @Column({ type: 'int', default: 1 })
    version!: number; // e.g., 1, 2, 3 (Increments each time a party counters/revises)

    @Column({ name: 'is_active', type: 'bit', default: true })
    isActive!: boolean; // True only for the latest round in negotiation history

    @Column({ name: 'client_category', type: 'varchar', length: 100, nullable: true })
    clientCategory!: string | null;

    @Column({ name: 'contact_person', type: 'nvarchar', length: 100, nullable: true })
    contactPerson!: string | null;

    @Column({ name: 'delivery_location', type: 'nvarchar', length: 'MAX', nullable: true })
    deliveryLocation!: string | null;

    @Column({ name: "total_amount", type: "decimal", precision: 14, scale: 2, default: 0.00 })
    totalAmount!: number;

    @Column({ name: 'remarks_notes', type: 'nvarchar', length: 'MAX', nullable: true })
    remarksNotes!: string | null;

    @Column({ name: 'created_by_user_id', type: 'int', nullable: true })
    createdByUserId!: number | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => QuotationItem, (item: QuotationItem) => item.quotation, { cascade: true })
    items!: QuotationItem[];
}
