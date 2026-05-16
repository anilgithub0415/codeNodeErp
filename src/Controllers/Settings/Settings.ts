import { Router, Request, Response } from 'express';
// Import the specific getter for SettingsService
import { getSettingsServiceRepository } from '../../dependencies'; // Corrected getter name

import { globalEvents } from '../../Special/ConstantsNEnums';
const eventemitter = require('../../Special/notifier'); // Still CommonJS for now

const router = Router();

// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    // In a real app, you'd probably have an Auth middleware before this
    // to check if the user is an admin for accessing settings.
    try {
        const settingsService = getSettingsServiceRepository(); // Attempt to get the service
        // You could attach it to res.locals or req for later use if desired,
        // but directly calling the getter in each route is also fine.
        next();
    } catch (error: any) {
        console.error('SettingsService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Settings service not ready.' });
    }
});


// GET /api/admin-settings - Get current settings (assuming this is a GET route, not POST)
router.get('/', async (req: Request, res: Response) => {
    // Implement authentication/authorization here!
    try {
        const settingsService = getSettingsServiceRepository(); // Get the singleton instance
        const currentSettings = settingsService.getSettings(); // Get the cached settings
        res.status(200).json(currentSettings);
    } catch (error: any) {
        console.error('Failed to retrieve settings:', error.message || error);
        res.status(500).json({ message: 'Failed to retrieve settings.' });
    }
});
 
// PUT /api/admin-settings - Update (save) settings
// This was previously router.put('/') and seemed to save settings. Let's keep it that way.
router.put('/', async (req: Request, res: Response) => {
    // Implement authentication/authorization here to ensure only authorized admins can call this!
    try {
        const settingsService = getSettingsServiceRepository(); // Get the singleton instance

        // Ensure these properties exist and are numbers before passing
        const newAccessTokenLifetime =parseInt( req.body.accessTokenLifetime); // Renamed from newAccessTokenLifetime for consistency
        const newRefreshTokenLifetime =parseInt( req.body.refreshTokenLifetime); // Renamed for consistency
console.log('req.body.accessTokenLifetime:'+req.body.accessTokenLifetime);

        if (typeof newAccessTokenLifetime !== 'number' || typeof newRefreshTokenLifetime !== 'number') {
           // return res.status(400).json({ message: 'Invalid input: accessTokenLifetime and refreshTokenLifetime must be numbers.' });
           
        }

        // Call the saveSettings method on the singleton instance
        //await settingsService.saveSettings(newAccessTokenLifetime, newRefreshTokenLifetime);
        await settingsService.saveSettings(req.body);

        // Emit event to notify other parts of the app (like SettingsService's own constructor)
        eventemitter.emit(globalEvents.accessTokenExpiryChanged);

        res.status(200).json({ message: 'Application settings updated successfully.' });
    } catch (error: any) {
        console.error('Failed to save settings:', error.message || error);
        res.status(500).json({ message: 'Failed to save settings.' });
    }
});

export default router;