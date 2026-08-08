import { Router, Request, Response } from 'express';
import { getDistrictRepository} from '../../dependencies'
import PriceCalculationService from '../../services/PriceCalculationEngine';
import { AppDataSource } from '../../../data-source';


interface CreateDistrictRequestBody{
    id:number,
    tenantId:number,
    districtName:string,
    description:string
    
}
const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    
    try {
        const districtService = getDistrictRepository(); // Attempt to get the service
      
        next();
    } catch (error: any) {
        console.error('DistrictService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. District service not ready.' });
    }
}); 




    router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            
            
            var tenantId= parseInt( req.params.tenantId as string);        
            var prodId=parseInt(req.params.id as string);
            const districtService = getDistrictRepository(); 
            
        
            const aDistrict = await districtService.getDistrict(tenantId,prodId);
            res.status(200).json(aDistrict);
        } catch (error: any) {
            console.error('Failed to retrieve a district:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a district: " + error.message });
        }
    });

    router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
          
        
            
            const districtService = getDistrictRepository(); // <--- Get the singleton instance from dependencies.ts
            var tenantId=parseInt(req.params.tenantId);
                     
        
        
            const districts = await districtService.getDistricts(tenantId!);
            // In a multi-tenant app, this should usually be filtered by the requesting district's tenantId.
            // Example: const districts = await districtService.getDistrictsByTenant(req.tenantId);
            //var districts2=districts.filter(usr=>roles?.includes(usr.role.rolename))
            res.status(200).json(districts);
        } catch (error: any) {
            console.error('Failed to retrieve districts:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve districts: " + error.message });
        }
    });

// ==========================================
// POST: REGISTER A NEW DISTRICT (Create)
// ==========================================
router.route('').post(async (req: Request, res: Response) => {
    try {
        const districtService = getDistrictRepository(); // 🔑 Clean Singleton dependency lookup

        if (!req.body.districtName) {
            return res.status(400).json({ message: 'District Name is required for creation.' });
        }

        const secureDistrictPayload = {
            ...req.body,
            tenantId: req.user.tenantId,        // Lock data namespace context [6]
            createdByUserId: req.user.id        // Audit log identification stamp
        };

        const district = await districtService.createDistrictClean(secureDistrictPayload);
        return res.status(201).json(district);      // ✅ 21 Created Status
    } catch (error: any) {
        return res.status(400).json({ 'message': 'District creation failed: ' + error.message });
    }
});

// ==========================================
// PUT: MODIFY AN EXISTING DISTRICT (Update)
// ==========================================
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        const districtService = getDistrictRepository(); // 🔑 Clean Singleton dependency lookup
        const targetDistrictId = parseInt(req.params.id, 10);

        if (isNaN(targetDistrictId)) {
            return res.status(400).json({ message: 'Invalid District identification ID path format parameter.' });
        }

        const loggedInTenantId = req.user.tenantId;
        const { id, tenantId, ...updatableFields } = req.body;

        const updatedDistrict = await districtService.updateDistrict(
            targetDistrictId, 
            loggedInTenantId, 
            updatableFields
        );

        return res.status(200).json(updatedDistrict); // ✅ 200 OK Status
    } catch (error: any) {
        return res.status(400).json({ 'message': 'District update failed: ' + error.message });
    }
});


 
export default router;