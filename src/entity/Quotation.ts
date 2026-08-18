import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Check, ManyToOne, JoinColumn } from 'typeorm';
import { QuotationItem } from './QuotationItem';
import { Customer } from './Customer';

// 1. Define the negotiation status enum

export enum QuotationStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    SENT = "SENT",
    CLIENT_APPROVED = "CLIENT_APPROVED",
    COUNTER_OFFERED = "COUNTER_OFFERED",
    REVISED = "REVISED",
    REJECTED = "REJECTED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
// 2. Add SQL Check constraint covering all enum values
@Check(`"total_amount" >= 0`)
@Check(`status IN ('DRAFT', 'PENDING_APPROVAL','APPROVED', 'SENT','CLIENT_APPROVED', 'COUNTER_OFFERED', 'REVISED', 'REJECTED', 'EXPIRED','CANCELLED')`)
@Entity("quotations")
export class Quotation {

    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: 'int' })
    tenantId!: number;


    //Pending: Remove nullable true, as we mandate QuotationDate
    @Column({ type: "date", nullable: true })
    quotationDate!: Date; 

    // -------------------------------
    // SOURCE DOCUMENT TRACKING
    // -------------------------------

    @Column({
        type: 'int',
        nullable: true
    })
    originatingClientRfqId!: number | null;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: true
    })
    originatingClientRfqNumber!: string | null;

    // -------------------------------
    // CUSTOMER
    // -------------------------------

    @Column({ name: 'client_id', type: 'int' })
    clientId!: number;

    @ManyToOne(() => Customer, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'client_id' })
    client!: Customer;

    // Transaction snapshots
    @Column({ name: 'client_name', type: 'nvarchar', length: 150 })
    clientName!: string;

    @Column({ name: 'client_category', type: 'varchar', length: 100, nullable: true })
    clientCategory!: string | null;

    @Column({ name: 'contact_person', type: 'nvarchar', length: 100, nullable: true })
    contactPerson!: string | null;

    @Column({ name: 'delivery_location', type: 'nvarchar', length: 'MAX', nullable: true })
    deliveryLocation!: string | null;

    // -------------------------------
    // DOCUMENT DETAILS
    // -------------------------------

    @Column({
        type: "varchar",
        length: 25,
        default: QuotationStatus.DRAFT
    })
    status!: QuotationStatus;

    @Column({
        name: 'quote_number',
        type: 'varchar',
        length: 50
        ,nullable:true //Pending:remove nullable true
    })
    quoteNumber!: string;

    @Column({
        type: 'int',
        default: 1
    })
    version!: number;

    @Column({
        name: 'is_active',
        type: 'bit',
        default: true
    })
    isActive!: boolean;

    // -------------------------------
    // TOTALS
    // -------------------------------

    @Column({
        name: "total_amount",
        type: "decimal",
        precision: 14,
        scale: 2,
        default: 0
    })
    totalAmount!: number;

    // -------------------------------
    // NOTES
    // -------------------------------

    @Column({
        name: 'remarks_notes',
        type: 'nvarchar',
        length: 'MAX',
        nullable: true
    })
    remarksNotes!: string | null;

    @Column({
        name: 'created_by_user_id',
        type: 'int',
        nullable: true
    })
    createdByUserId!: number | null;

    // -------------------------------
    // ITEMS
    // -------------------------------

    @OneToMany(
        () => QuotationItem,
        item => item.quotation,
        {
            cascade: true,
            orphanedRowAction: "delete"
        }
    )
    items!: QuotationItem[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}