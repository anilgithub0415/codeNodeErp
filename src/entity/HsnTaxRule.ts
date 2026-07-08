        // src/entity/HsnTaxRule.ts
        import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
        import { ProductTemplate } from './product_template';

        @Entity({ name: 'HsnTaxRule' })
        export class HsnTaxRule {
            @PrimaryGeneratedColumn()
            id!: number; 

            @Column({ type: 'nvarchar', length: 10, unique: true })
            hsnCode!: string; // e.g., "39172390" or "84818030"

            @Column({ type: 'nvarchar', length: 255 })
            description!: string; // e.g., "PVC Rigid Pipes"

            @Column({ type: 'decimal', precision: 5, scale: 2, default: 9.00 })
            cgstRate!: number; // 9.00%

            @Column({ type: 'decimal', precision: 5, scale: 2, default: 9.00 })
            sgstRate!: number; // 9.00%

            @Column({ type: 'decimal', precision: 5, scale: 2, default: 18.00 })
            igstRate!: number; // 18.00%
        }
