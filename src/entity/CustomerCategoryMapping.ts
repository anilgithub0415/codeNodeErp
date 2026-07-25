import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('CustomerCategoryMapping')
@Unique(['tenantId', 'categoryName'])
export class CustomerCategoryMapping {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'int'})
    tenantId!: number;

    @Column({ type: 'nvarchar', length: 100 })
    categoryName!: string; // e.g., 'Wholesaler', 'Dealer', 'B2B'

    @Column({ type: 'nvarchar', length: 10 })
    channelCode!: string; // e.g., 'W', 'DLR', 'B2B'

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
