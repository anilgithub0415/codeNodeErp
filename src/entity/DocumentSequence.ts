import { Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm";

@Entity("document_sequences")
@Unique(["documentType", "prefixYearMonth"])
export class DocumentSequence {
    @PrimaryGeneratedColumn({ type: "int" })
    id!: number;

    @Column({ name: "document_type", type: "varchar", length: 20 })
    documentType!: string; // e.g., 'SALES_ORDER'

    @Column({ name: "prefix_year_month", type: "varchar", length: 6 })
    prefixYearMonth!: string; // e.g., '2606'

    @Column({ name: "current_value", type: "int", default: 100000 })
    currentValue!: number;
}
