import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm'
import { SalesOrderItem } from './SalesOrderItem'
import { MinLength } from 'class-validator';
import { Site } from './Site';
import { Customer } from './Customer';


export enum SOStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    SENT = "SENT",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    CLOSED = "CLOSED",
    CANCELLED = "CANCELLED"
}
//for defining salesorder source is Client PO/RFQ/Manual
export enum OrderSourceType {
    MANUAL = "MANUAL",
    CLIENT_PO = "CLIENT_PO",
    RFQ = "RFQ",
    ECOMMERCE = "ECOMMERCE"
}
/*
corrected summary: 
in master detail relation in 
      1. master use cascade: true   
      2. child onDelete: 'CASCADE'  , orphanedRowAction: "delete"  
  
  In flat entity (not a masterdetail) specify onDelete: 'NO ACTION' and never say onDelete: 'cascade'
 */


  //Pending important global: Check evey field where 
  // number | null
  // or
  // string | null
@Entity("sales_orders")
export class SalesOrder{
    @PrimaryGeneratedColumn('increment')
    id!: number;

      @Column({type:'int'})
    tenantId!:number;

    //  @ManyToOne(() => Tenant, (tenant) => tenant.salesorders, { onDelete: "RESTRICT" })
    //     @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
    //     tenant!: Tenant;

    @Column()
      @MinLength(5, { message: "POnumber must be at least 5 characters long" }) // 2. Application-level validation
    soNumber!: string;


    // Add this to your SalesOrder entity class
    @Column({ type: 'varchar', default: OrderSourceType.MANUAL })
    sourceType!: OrderSourceType;
 

        // Inside your sales-order.entity.ts
        @Column({ name: "customer_po_number", type: "varchar", length: 50, nullable: true })
        customerPoNumber!: string | null; // The PO number sent by your client

    @Column({ type: "date", nullable: true })
    customerPoDate!: Date|null; // The date printed on the client's PO

     @Column({
        name: 'client_purchase_order_id',
        type: 'int',
        nullable: true
    })
    clientPurchaseOrderId!: number | null;

    @Column({
        name: 'client_purchase_order_number',
        type: 'varchar',
        length: 50,
        nullable: true
    })
    clientPurchaseOrderNumber!: string | null;

    
    @Column()
    clientId!: number | null; // Keeps raw numeric access

    @ManyToOne(() => Customer, { onDelete: 'NO ACTION' }) // Protects data, smooth transactions
    @JoinColumn({ name: 'clientId' })
    client!: Customer;

   @Column({nullable:true})
    siteId!: number | null; // Keeps raw numeric access

    @ManyToOne(() => Site, { onDelete: 'NO ACTION' }) // Protects data, smooth transactions
    @JoinColumn({ name: 'siteId' })
    site!: Site;

    @Column({ default: 'draft' })
    status!: string;

    @Column({ name: "sub_total", type: "decimal", precision: 10, scale: 2, default: 0 })
    subTotal!: number;

    @Column({ name: "tax_amount", type: "decimal", precision: 10, scale: 2, default: 0 })
    taxAmount!: number;

    @Column({ name: "shipping_amount", type: "decimal", precision: 10, scale: 2, default: 0 })
    shippingAmount!: number;

    @Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2, default: 0 })
    totalAmount!: number;

    @OneToMany(() => SalesOrderItem, (item: SalesOrderItem) => item.salesOrder, { cascade: true , orphanedRowAction: "delete"  })
    items!: SalesOrderItem[];

    @Column({ type: 'simple-json', nullable: true })
    customAttributes!: Record<string, any> | null;

    @CreateDateColumn({ name: 'created_at' ,nullable: true})
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' ,nullable: true})
    updatedAt!: Date;

    @Column({ nullable:true})
    createdByUserId!:number;
}
