// src/entity/Config.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Tenant } from './Tenant';

// This class defines the structure of your 'Config' table in the database.
// It is designed to hold a single row of global application settings.
@Entity({ name: 'Config' }) // You can customize the table name if 'Config' isn't suitable, e.g., 'ApplicationConfig'
export class Config {

    @PrimaryGeneratedColumn()
        id!: number;
     
         @Column({type:'int'})
        tenantId!:number;

        @ManyToOne(() => Tenant, (tenant) => tenant.configs, { onDelete: 'NO ACTION' })
         @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
         tenant!: Tenant;

    // Primary Key for a Single Record Table:
    // We use @PrimaryColumn() for a non-generated primary key.
    // The value will be a fixed string (e.g., 'global_settings'), ensuring only one record.
    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'appname' })
    appname!: string; // Using 'settingKey' as the column name for clarity

 
    // Decides whether user added thru superadmin or signup  
    @Column({  name: 'config_useraddthru', type: 'nvarchar', length: 20 ,nullable:true})
   config_useraddthru!: string;

    @Column({  name: 'config_productFlatOrVariant', type: 'nvarchar', length: 20, default:'ProductFlat' })
   config_productFlatOrVariant!: string;
    
}