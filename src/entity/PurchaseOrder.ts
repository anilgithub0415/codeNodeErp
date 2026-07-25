import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Check } from 'typeorm'
import { PurchaseOrderItem } from './PurchaseOrderItem'
import { MinLength } from 'class-validator';
import { Vendor } from './Vendor';

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

@Entity("purchase_orders")
export class PurchaseOrder{
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column()
     @MinLength(5, { message: "POnumber must be at least 5 characters long" }) // 2. Application-level validation
    poNumber!: string;

    @Column({type:'int'})
    tenantId!:number;

   @Column({ 
        type: "varchar", 
        length: 25, // Generous enough padding for your longest status string
        default: POStatus.DRAFT 
    })
    status!: POStatus;

    @Column()
    vendorId!: number;

    @ManyToOne(() => Vendor, { onDelete: 'NO ACTION' }) // Protects vendor from accidental deletion
    @JoinColumn({ name: 'vendorId' }) // Links the relation to your existing column
    vendor!: Vendor;

    @Column({type: 'date'})
    orderDate!: Date

    @Column({type: 'date', nullable:true})
    deliveryDate!: Date

    

    @Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2, default: 0 })
    totalAmount!: number;

    @Column({type:'nvarchar', length:'MAX', nullable:true})
    notes!:string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => PurchaseOrderItem, (item: PurchaseOrderItem) => item.purchaseOrder, { cascade: true })
    items!: PurchaseOrderItem[];

}
