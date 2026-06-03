import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, RelationId, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { PurchaseOrder } from './PurchaseOrder'
import { Product } from './Product'

@Entity('purchase_order_items')
export class PurchaseOrderItem {
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

    

    @Column()
    purchaseOrderId!: number;
    @ManyToOne(() => PurchaseOrder, (order) => order.items, { onDelete: 'NO ACTION' })
        @JoinColumn({ name: 'purchaseOrderId' })
        purchaseOrder!: PurchaseOrder;

    @Column()
    productId!: number;

    @Column({ type: 'decimal', default: 1 })
    quantity!: number;

    @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
    finalPrice!: number;


    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

}
