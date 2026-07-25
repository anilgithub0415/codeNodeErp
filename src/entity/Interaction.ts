// src/entity/Interaction.ts
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    JoinColumn, 
    CreateDateColumn, 
    UpdateDateColumn 
} from 'typeorm';
import { Tenant } from './Tenant';
import { Customer } from './Customer';
import { User } from './User';

@Entity({ name: 'Interaction' })
export class Interaction {
    @PrimaryGeneratedColumn('increment')
    interactionId!: number;

    // Multi-tenant control
    @Column({ type: 'int', name: 'tenantId' })
    tenantId!: number;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    // Target Customer
    @Column({ type: 'int', name: 'customerId' })
    customerId!: number;

    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customerId' })
    customer!: Customer;

    // Executed by (Salesperson)
    @Column({ type: 'int', name: 'userId' })
    userId!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user!: User;

    // Interaction Metadata
    @Column({ type: 'nvarchar', length: 50, name: 'channel' }) // 'Call', 'WhatsApp', 'Email', 'In-Person Visit'
    channel!: string;

    @Column({ type: 'nvarchar', length: 50, name: 'direction' }) // 'Inbound', 'Outbound'
    direction!: string;

    @Column({ type: 'nvarchar', length: 150, name: 'purpose', nullable: true }) // 'Sample Feedback', 'Price Negotiation', 'Payment Follow-up'
    purpose?: string;

    @Column({ type: 'nvarchar', length: 'MAX', name: 'notes', nullable: true })
    notes?: string;

    // Wholesale Sanitary specific features
    @Column({ type: 'bit', default: false, name: 'isSampleFeedback' }) // Filter interactions where customer reviewed mops/brushes samples
    isSampleFeedback!: boolean;

    @Column({ type: 'nvarchar', length: 255, name: 'attachmentUrl', nullable: true }) // Shared files (e.g., photo of leaked chemical bottles)
    attachmentUrl?: string;

    // Next actionable trigger
    @Column({ type: 'datetime2', name: 'nextFollowUpDate', nullable: true })
    nextFollowUpDate?: Date | null;

    @Column({ type: 'nvarchar', length: 255, name: 'nextFollowUpObjective', nullable: true }) // 'Follow up on micro-fiber mop thickness pricing'
    nextFollowUpObjective?: string;

    @CreateDateColumn({ type: 'datetime2', name: 'createdAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'updatedAt' })
    updatedAt!: Date;
}
