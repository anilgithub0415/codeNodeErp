// src/entity/User_table_fields.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn } from 'typeorm';

// This class defines the structure of your 'User_table_fields' table in the database.
@Entity({ name: 'User_table_fields' }) 
export class User_table_fields {

    @PrimaryGeneratedColumn()
    id!: number;
 
    // Decides whether user added thru superadmin or signup  
    @Column({  name: 'FieldName', type: 'nvarchar', length: 20 })
    FieldName!: string;

    @Column({  name: 'FieldType', type: 'nvarchar', length: 20 })
    FieldType!: string;

    @Column({  name: 'FieldLabel', type: 'nvarchar', length: 20 })
    FieldLabel!: string;

    @Column({  name: 'IsRequired',  type: 'bit', default: true })
    IsRequired!: boolean;
 
    @Column({  name: 'CreatedByMode', type: 'nvarchar', length: 20 })
    CreatedByMode!: string;


    
}