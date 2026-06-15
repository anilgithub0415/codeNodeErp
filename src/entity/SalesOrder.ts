import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm'
import { SalesOrderItem } from './SalesOrderItem'


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
    soNumber!: string;

    @Column()
    customerId!: number;

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

    @OneToMany(() => SalesOrderItem, (item: SalesOrderItem) => item.salesOrder, { cascade: true })
    items!: SalesOrderItem[];

    @Column({ type: 'simple-json', nullable: true })
    customAttributes!: Record<string, any> | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

}
