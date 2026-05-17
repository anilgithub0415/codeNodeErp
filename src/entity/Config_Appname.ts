// src/entity/AppName.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

// This class defines the structure of your 'AppName' table in the database.
// It is designed to hold a single row of global application settings.
@Entity({ name: 'Config_AppName' }) 
export class Config_AppName {

    // Primary Key for a Single Record Table:
    // We use @PrimaryColumn() for a non-generated primary key.
    // The value will be a fixed string (e.g., 'global_settings'), ensuring only one record.
    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'appname' })
    appname!: string; // Using 'settingKey' as the column name for clarity



    
}