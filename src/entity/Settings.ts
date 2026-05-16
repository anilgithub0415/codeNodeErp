// src/entity/Settings.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

// This class defines the structure of your 'Settings' table in the database.
// It is designed to hold a single row of global application settings.
@Entity({ name: 'Settings' }) // You can customize the table name if 'Settings' isn't suitable, e.g., 'ApplicationSettings'
export class Settings {

    // Primary Key for a Single Record Table:
    // We use @PrimaryColumn() for a non-generated primary key.
    // The value will be a fixed string (e.g., 'global_settings'), ensuring only one record.
    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'settingKey' })
    settingKey!: string; // Using 'settingKey' as the column name for clarity

    // Expiry for Access Tokens (in seconds)
    @Column({  name: 'accessTokenLifetime', type: 'int' })
    accessTokenLifetime!: number;

    @Column({  name: 'refreshTokenLifetime', type: 'int'  })
    refreshTokenLifetime!: number;

    // Expiry for Refresh Tokens (in seconds)
    //@Column({  name: 'refreshTokenExpiry', type: 'nvarchar', length: 10 })
    //refreshTokenExpiry!: string;

    //*pending currently refreshTokenExpiry is type Int and stores 3699 means 1 hour
    //and need to store 604800 seconds means 7d




    // You can add more settings columns here as needed in the future:
    // @Column({ type: 'nvarchar', length: 255, name: 'featureToggleX', nullable: true })
    // featureToggleX?: string;

    // @Column({ type: 'boolean', name: 'enableUserRegistration', default: true })
    // enableUserRegistration!: boolean;
}