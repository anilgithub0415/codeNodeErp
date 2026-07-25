import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DeliveryChallan } from './DeliveryChallan';
import { SalesOrderItem } from './SalesOrderItem';
import { ProductVariant } from './productVariant';

@Entity('delivery_challan_items')
export class DeliveryChallanItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'delivery_challan_id' })
    deliveryChallanId!: number;

    @ManyToOne(() => DeliveryChallan, (dc) => dc.items, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'delivery_challan_id' })
    deliveryChallan!: DeliveryChallan;

    @Column({ name: 'sales_order_item_id' })
    salesOrderItemId!: number;

    @ManyToOne(() => SalesOrderItem, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'sales_order_item_id' })
    salesOrderItem!: SalesOrderItem;

    @ManyToOne(() => ProductVariant, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'product_id' })
    product!: ProductVariant;

    @Column({ name: 'product_id' })
    productId!: number;

    @Column({ type: 'int', default: 0 })
    quantityShipped!: number; // 👈 Tracks actual package content count

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
