// src/services/SettingsService_1.ts
import { Repository } from 'typeorm'; // Import Repository directly
import { Settings } from '../entity/Settings'; // Import your Settings entity
import { globalEvents } from '../Special/ConstantsNEnums'; // Ensure this path is correct
import { BackendGlobalsettingsDto } from '../dto/settings.dto';
const eventemitter = require('../Special/notifier'); // Assuming CommonJS for now

// Define an interface for your cached application settings
export interface AppSettings {
    accessTokenLifetime: number; // Stored in seconds - Matches entity column name
    refreshTokenLifetime: number; // Stored in seconds - Matches entity column name
    // Add other settings here if needed
}

class SettingsService {
    // This will be set by the init method, after AppDataSource is ready
    private settingsRepository!: Repository<Settings>;
    
    private currentSettings: AppSettings = {
        accessTokenLifetime: 3600,   // Default: 1 hour
        refreshTokenLifetime: 604800 // Default: 7 days
    };
    private isInitialized = false;

    constructor() {
        // Subscribe to events. Use an arrow function to preserve `this` context.
        eventemitter.on(globalEvents.accessTokenExpiryChanged, () => {
            console.log('accessTokenExpiryChanged Event occurred. Reloading settings...');
            this.ensureDefaultSettings().catch(error => { // Call ensureDefaultSettings to re-fetch/update cache
                console.error('Error reloading settings on event:', error);
            });
        });
    }

    /**
     * Initializes the SettingsService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Settings.
     */
    async init(repo: Repository<Settings>): Promise<void> {
        this.settingsRepository = repo;
        console.log("SettingsService repository initialized.");
    }

    /**
     * Ensures that a default settings record exists in the database.
     * If it doesn't exist, it creates one with predefined default values.
     * It then loads these settings into memory (this.currentSettings).
     */
    async ensureDefaultSettings(): Promise<void> {
        // Ensure repository is available before using it
        if (!this.settingsRepository) {
            throw new Error("SettingsService has not been initialized. Call init() first.");
        }

        const SETTINGS_KEY = 'global_settings'; // A fixed key for your single settings record

        console.log('Running ensureDefaultSettings...');
        try {
            // 1. Try to find the existing settings record by its primary key
            let dbSettings = await this.settingsRepository.findOne({ where: { settingKey: SETTINGS_KEY } });

            if (!dbSettings) {
                // 2. If no settings record found, create one with default values
                console.log('No global settings found in DB. Creating default settings record...');
                dbSettings = new Settings(); // Create an instance of the Settings entity
                dbSettings.settingKey = SETTINGS_KEY;
                dbSettings.accessTokenLifetime = this.currentSettings.accessTokenLifetime; // Use initial class defaults
                dbSettings.refreshTokenLifetime = this.currentSettings.refreshTokenLifetime; // Use initial class defaults

                // Save the new default settings to the database
                await this.settingsRepository.save(dbSettings);
                console.log('Default settings record created in DB.');
            } else {
                console.log('Global settings found in database.');
            }

            // 3. Update the in-memory cache with values from the database
            this.currentSettings.accessTokenLifetime = dbSettings.accessTokenLifetime;
            this.currentSettings.refreshTokenLifetime = dbSettings.refreshTokenLifetime;

            this.isInitialized = true;
            console.log(`Settings loaded: Access Token Lifetime = ${this.currentSettings.accessTokenLifetime} seconds`);
            console.log(`Settings loaded: Refresh Token Lifetime = ${this.currentSettings.refreshTokenLifetime} seconds`);

        } catch (error) {
            console.error('Error ensuring/loading default settings:', error);
            throw error; // Re-throw to indicate a critical initialization failure
        }
    }

    /**
     * Returns the current cached application settings.
     * Ensure ensureDefaultSettings() has been called prior to accessing for updated values.
     */
    public getSettings(): AppSettings {
        if (!this.isInitialized) {
            console.warn('SettingsService not fully initialized. Returning initial default settings. Ensure ensureDefaultSettings() was called.');
        }
        return this.currentSettings;
    }


     /**
     * Saves updated settings to the database and reloads the in-memory cache.
     * Use this method when an admin explicitly updates settings via an API.
     */
     public async saveSettings(data:BackendGlobalsettingsDto): Promise<Settings> {
        if (!this.settingsRepository) {
            throw new Error("SettingsService has not been initialized. Call init() first.");
        }

        const SETTINGS_KEY = 'global_settings';
        try {
            let dbSettings = await this.settingsRepository.findOne({ where: { settingKey: SETTINGS_KEY } });
            if (!dbSettings) {
                // If it doesn't exist, ensureDefaultSettings should have handled it.
                // But in case of direct save without prior load, create it.
                dbSettings = new Settings();
                dbSettings.settingKey = SETTINGS_KEY;
            }

            //dbSettings.accessTokenLifetime =data.accessTokenLifetime;
            //dbSettings.refreshTokenLifetime =data.refreshTokenLifetime;
            Object.assign(dbSettings,data);

            const savedSettings = await this.settingsRepository.save(dbSettings);

            // Update the in-memory cache immediately after saving to DB
            this.currentSettings.accessTokenLifetime = savedSettings.accessTokenLifetime;
            this.currentSettings.refreshTokenLifetime = savedSettings.refreshTokenLifetime;

            console.log('Global settings updated and cached.');
            return savedSettings;

        } catch (error) {
            console.error('Error updating global settings:', error);
            throw error;
        }
    }
}

export default SettingsService; // Export the class, not an instance