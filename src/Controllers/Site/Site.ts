import { Router, Request, Response } from 'express';
import { getSiteRepository} from '../../dependencies'
import PriceCalculationService from '../../services/PriceCalculationEngine';
import { AppDataSource } from '../../../data-source';


interface CreateSiteRequestBody{
    tenantId:number,
    siteName:string,
    siteContactPerson:string
   
}
const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    
    try {
        const siteService = getSiteRepository(); // Attempt to get the service
      
        next();
    } catch (error: any) {
        console.error('SiteService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Site service not ready.' });
    }
}); 




    router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            
            var tenantId= parseInt( req.params.tenantId);        
            var prodId=parseInt(req.params.id);
            const siteService = getSiteRepository(); 
            
        
            const aSite = await siteService.getSite(tenantId,prodId);
            res.status(200).json(aSite);
        } catch (error: any) {
            console.error('Failed to retrieve a site:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a site: " + error.message });
        }
    });

    router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const siteService = getSiteRepository(); // <--- Get the singleton instance from dependencies.ts
           var tenantId=parseInt(req.params.tenantId)
                     
        
        
            const sites = await siteService.getSites(tenantId!);
            // In a multi-tenant app, this should usually be filtered by the requesting site's tenantId.
            // Example: const sites = await siteService.getSitesByTenant(req.tenantId);
            //var sites2=sites.filter(usr=>roles?.includes(usr.role.rolename))
            res.status(200).json(sites);
        } catch (error: any) {
            console.error('Failed to retrieve sites:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve sites: " + error.message });
        }
    });

// ==========================================
// 1. POST: CREATE A NEW SITE
// ==========================================
router.route('').post(async (req: Request, res: Response) => {
    try {
        const siteService = getSiteRepository();

        // Basic payload input enforcement
        if (!req.body.siteName) {
            return res.status(400).json({ message: 'Site Name is required for registration.' });
        }

        // Overwrite and enforce backend token authorities
        const secureSitePayload = {
            ...req.body,
            tenantId: req.user.tenantId,        // Lock down tenancy context scope boundary
            createdByUserId: req.user.id        // Set permanent creation audit identifier
        };

        // Calling the fresh insertion service method built in Step 1
        const newSite = await siteService.createSiteClean(secureSitePayload);
        return res.status(201).json(newSite); // ✅ Clean 201 Created Status
    } catch (error: any) {
        return res.status(400).json({ 'message': 'Site creation failed: ' + error.message });
    }
});

// ==========================================
// 2. PUT: UPDATE AN EXISTING SITE RESOURCE
// ==========================================
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        const siteService = getSiteRepository();
        const targetSiteId = parseInt(req.params.id, 10);

        if (isNaN(targetSiteId)) {
            return res.status(400).json({ message: 'Invalid site URL identification path requested.' });
        }

        const loggedInTenantId = req.user.tenantId;

        // Stripping properties out of req.body that should never change on an update
        const { id, tenantId, customer, users, ...updatableFields } = req.body;

        // Pass control to your new update method, enforcing the tenant validation token context parameters
        const updatedSite = await siteService.updateSite(
            targetSiteId, 
            loggedInTenantId, 
            updatableFields
        );

        return res.status(200).json(updatedSite); // ✅ Clean 200 OK Status
    } catch (error: any) {
        return res.status(400).json({ 'message': 'Site update failed: ' + error.message });
    }
});




 
export default router;