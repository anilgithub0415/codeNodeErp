

/*use below for delete master record


@Entity({ name: 'Vendor' }) 
export class Vendor {
    @PrimaryGeneratedColumn()
    id!: number;

    // ... your other columns

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt!: Date; // TypeORM automatically filters this out of normal queries
}


if your business logic demands a true Hard Delete 
async removeVendor(id: number, tenantId: number): Promise<void> {
    try {
        // Ensure tenant isolation during deletion
        const result = await this.vendorRepository.delete({ id, tenantId });
        
        if (result.affected === 0) {
            throw new NotFoundException('Vendor not found');
        }
    } catch (error) {
        // Catch the Foreign Key violation error from the DB
        if (error.code === '23503' || error.message.includes('foreign key constraint')) {
            throw new BadRequestException(
                'Cannot delete this Vendor because they have active Purchase Orders associated with them.'
            );
        }
        throw error; // Re-throw any other unexpected errors
    }
}


*/

// src/entity/Vendor.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';


// This class defines the structure of your 'Vendor' table in the database.
@Entity({ name: 'Vendor' }) 
export class Vendor {

    @PrimaryGeneratedColumn()
    id!: number;
 
     @Column({type:'int'}) 
    tenantId!:number;
      
    @ManyToOne(() => Tenant, (tenant) => tenant.vendors, { onDelete: 'NO ACTION' })
         @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
         tenant!: Tenant;

    @Column({  name: 'vendor_name', type: 'nvarchar', length: 20 })
    vendorName!: string; 

    @Column({ type: 'nvarchar', length: 500, nullable: true })
    description?: string | null;

    @Column({ nullable:true})
    createdByUserId!:number;
    
}

