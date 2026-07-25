//Note
//tables product_template_table_fields,product_template_table_fields_tenantwise
//are for variant approach
//earlier non variant product approach was using 
//tables product_table_fields,product_table_fields_tenantwise

// src/entity/product_template_table_fields_tenantwise.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';

// This class defines the structure of your 'product_template_table_fields_tenantwise' table in the database.
@Entity({ name: 'product_template_table_fields_tenantwise_notinuse' }) 
export class product_template_table_fields_tenantwise {

   
    @PrimaryGeneratedColumn()
    id!: number;
    
    // @Column({type:'int'})
    // tenantId!:number;

    // @ManyToOne(() => Tenant, (tenant) => tenant.prodtblfieldtenantwises, { onDelete: 'NO ACTION' })
    //      @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
    //      tenant!: Tenant;

    // Decides whether user added thru superadmin or signup  
    @Column({  name: 'FieldName', type: 'nvarchar', length: 20 })
    FieldName!: string;

    @Column({  name: 'FieldType', type: 'nvarchar', length: 20 })
    FieldType!: string;

    @Column({  name: 'FieldLabel', type: 'nvarchar', length: 20 })
    FieldLabel!: string;

    
 @Column({  name: 'className', type: 'nvarchar', length: 50 })
    className!: string;  
          

    @Column({type:'nvarchar',length:200,nullable:true})
    SelectOptions!:string

    @Column({  name: 'IsRequired',  type: 'bit', default: true })
    IsRequired!: boolean;
    

    
}
