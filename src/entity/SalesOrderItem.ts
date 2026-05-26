import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, RelationId, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { SalesOrder } from './SalesOrder'
import { Product } from './Product'

@Entity('sales_order_items')
export class SalesOrderItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => SalesOrder, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sales_order_id' })
    salesOrder!: SalesOrder;

    @RelationId((item: SalesOrderItem) => item.salesOrder)
    salesOrderId!: number;

    @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'product_id' })
    product!: Product;

    @RelationId((item: SalesOrderItem) => item.product)
    productId!: number;

    @Column({ type: 'int', default: 1 })
    quantity!: number;

    @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
    unitPrice!: number;

    @Column({ type: 'varchar', nullable: true })
    description!: string | null;

    @Column({ type: 'varchar', nullable: true })
    sku!: string | null;

    @Column({ type: 'simple-json', nullable: true })
    customAttributes!: Record<string, any> | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

}
