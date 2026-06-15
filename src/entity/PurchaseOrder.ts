import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm'
import { PurchaseOrderItem } from './PurchaseOrderItem'


@Entity("purchase_orders")
export class PurchaseOrder{
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column()
    poNumber!: string;

    @Column({type:'int'})
    tenantId!:number;

    @Column()
    vendorId!: number;

    @Column({type: 'date'})
    orderDate!: Date

    @Column({type: 'date', nullable:true})
    deliveryDate!: Date

    @Column({type: 'varchar',  length: 20, default:'DRAFT'})
    status!: string

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
