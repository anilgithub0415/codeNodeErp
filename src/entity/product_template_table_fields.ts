

//Note
//tables product_template_table_fields,product_template_table_fields_tenantwise
//are for variant approach
//earlier non variant product approach was using 
//tables product_table_fields,product_table_fields_tenantwise

// src/entity/product_template_table_fields.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn } from 'typeorm';

// This class defines the structure of your 'product_template_table_fields' table in the database.
@Entity({ name: 'product_template_table_fields' }) 
export class product_template_table_fields_notinuse {

   
    @PrimaryGeneratedColumn()
    id!: number;
 

    // Decides whether user added thru superadmin or signup  
    @Column({  name: 'FieldName', type: 'nvarchar', length: 20 })
    FieldName!: string;

    @Column({  name: 'FieldType', type: 'nvarchar', length: 20 })
    FieldType!: string;


    @Column({  name: 'FieldLabel', type: 'nvarchar', length: 20 })
    FieldLabel!: string;
    
     @Column({  name: 'GroupClassName', type: 'nvarchar', length: 50 })
    GroupClassName!: string;  

    @Column({  name: 'className', type: 'nvarchar', length: 50 })
    className!: string;  
      

    @Column({type:'nvarchar',length:200,nullable:true})
    SelectOptions!:string

    @Column({  name: 'IsRequired',  type: 'bit', default: true })
    IsRequired!: boolean;  
 
   

    
}
