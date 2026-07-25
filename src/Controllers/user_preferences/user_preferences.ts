import { Router, Request, Response } from 'express';
import { getUser_PreferenceRepository} from '../../dependencies'
import PriceCalculationService from '../../services/PriceCalculationService';
import { AppDataSource } from '../../../data-source';
//import { user_Preference_table_fields } from '../../entity/user_Preference_table_fields';
//import { user_Preference_table_fields_tenantwise } from '../../entity/user_Preference_table_fields_tenantwise';

export interface CreateUser_PreferenceRequestBody {
    userId: number;
    tenantId: number;
    preset?: string;     // Theme family (e.g., 'Aura')
    primary?: string;    // Color selection (e.g., 'emerald')
    surface?: string;    // Secondary palette
    darkTheme?: boolean; // Dark mode toggle (maps to 'bit' column)
    menuMode?: string;
}

export interface CreateUser_PreferenceDto {
    userId: number;
    tenantId: number;
    preset?: string;
    primary?: string;
    surface?: string | null;
    darkTheme?: boolean;
    menuMode?: string;
}

const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    
    try {
        const user_PreferenceService = getUser_PreferenceRepository(); // Attempt to get the service
      
        next();
    } catch (error: any) {
        console.error('User_PreferenceService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. User_Preference service not ready.' });
    }
}); 




    router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            
            var tenantId= parseInt( req.params.tenantId);        
            var userId=parseInt(req.params.id);
            console.log('.....................pull usr pref for uid:',userId);
            const user_PreferenceService = getUser_PreferenceRepository(); 
            
        
            const aUser_Preference = await user_PreferenceService.getUser_Preference(tenantId,userId);
            res.status(200).json(aUser_Preference);
        } catch (error: any) {
            console.error('Failed to retrieve a user_Preference:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a user_Preference: " + error.message });
        }
    });

    router.route('/:tenantId/:id')
    .delete(async (req: Request, res: Response) => {
        try {
            
            const tenantId = parseInt(req.params.tenantId);        
            const userId = parseInt(req.params.id);
            
            const user_PreferenceService = getUser_PreferenceRepository(); 
            
            await user_PreferenceService.deleteUser_Preference(tenantId, userId);
            
            // 204 No Content is standard for successful deletions with no body
            res.status(204).send(); 
        } catch (error: any) {
            console.error('Failed to delete a user_Preference:', error.message || error);
            res.status(500).json({ "message": "Failed to delete a user_Preference: " + error.message });
        }
    });

    router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const user_PreferenceService = getUser_PreferenceRepository(); // <--- Get the singleton instance from dependencies.ts
           var tenantId=parseInt(req.params.tenantId)
                     
        
        
            const user_Preferences = await user_PreferenceService.getUser_Preferences(tenantId!);
            // In a multi-tenant app, this should usually be filtered by the requesting user_Preference's tenantId.
            // Example: const user_Preferences = await user_PreferenceService.getUser_PreferencesByTenant(req.tenantId);
            //var user_Preferences2=user_Preferences.filter(usr=>roles?.includes(usr.role.rolename))
            res.status(200).json(user_Preferences);
        } catch (error: any) {
            console.error('Failed to retrieve user_Preferences:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve user_Preferences: " + error.message });
        }
    });

router.route('')
    .post(async (req: Request<{}, {}, CreateUser_PreferenceRequestBody>, res: Response) => {
        try {
            const user_PreferenceService = getUser_PreferenceRepository();

            // 1. EXTRACT FROM DECODED JWT (Enforces true session authority)
            const loggedInTenantId = req.user.tenantId; 
            const loggedInUserId = req.user.id; // Or req.user.userId depending on token payload configuration

            // 2. OVERWRITE FRONTEND INJECTIONS FOR BULLETPROOF SECURITY
            const securePreferencePayload = {
                ...req.body,
                userId: loggedInUserId,       // Enforce composite PrimaryKey isolation
                tenantId: loggedInTenantId    // Lock to authorized session tenant space
            };

            console.log('Processed Secure User Context Payload Request Body:', securePreferencePayload);

            // 3. Persist the sanitized preference configurations
            const user_Preference = await user_PreferenceService.createUser_Preference(securePreferencePayload);
            
            return res.status(201).json(user_Preference);
        } catch (error: any) {
            console.error('User reference preference configuration failed:', error.message || error);
            return res.status(400).json({ message: 'User preference configuration failed: ' + error.message });
        }
    });


 
export default router;