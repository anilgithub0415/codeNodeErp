import { Router, Request, Response } from 'express';
import { getCityRepository} from '../../dependencies'
import PriceCalculationService from '../../services/PriceCalculationEngine';
import { AppDataSource } from '../../../data-source';


interface CreateCityRequestBody{
    tenantId:number,
    cityName:string,
    cityAbbrevation:string
   
}
const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    
    try {
        const cityService = getCityRepository(); // Attempt to get the service
      
        next();
    } catch (error: any) {
        console.error('CityService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. City service not ready.' });
    }
}); 




    router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            
            var tenantId= parseInt( req.params.tenantId);        
            var pId=parseInt(req.params.id);
            const cityService = getCityRepository(); 
            
        
            const aCity = await cityService.getCity(tenantId,pId);
            res.status(200).json(aCity);
        } catch (error: any) {
            console.error('Failed to retrieve a city:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a city: " + error.message });
        }
    });

    router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const cityService = getCityRepository(); // <--- Get the singleton instance from dependencies.ts
           var tenantId=parseInt(req.params.tenantId)
                     
        
        
            const citys = await cityService.getCitys(tenantId!);
       
            res.status(200).json(citys);
        } catch (error: any) {
            console.error('Failed to retrieve citys:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve citys: " + error.message });
        }
    });

// ==========================================
// POST: REGISTER A NEW CITY
// ==========================================
router.route('').post(async (req: Request, res: Response) => {
    try {
        const cityService = getCityRepository();

        if (!req.body.cityName || !req.body.cityAbbrevation) {
            return res.status(400).json({ message: 'City Name and Abbreviation are mandatory.' });
        }

        const secureCityPayload = {
            ...req.body,
            tenantId: req.user.tenantId,        // Lock data namespace context 
            createdByUserId: req.user.id        // Audit log identification stamp
        };

        const city = await cityService.createCityClean(secureCityPayload);
        return res.status(201).json(city);      // ✅ 201 Created Status
    } catch (error: any) {
        return res.status(400).json({ 'message': 'City creation failed: ' + error.message });
    }
});

// ==========================================
// PUT: MODIFY AN EXISTING CITY
// ==========================================
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        const cityService = getCityRepository();
        const targetCityId = parseInt(req.params.id, 10);

        if (isNaN(targetCityId)) {
            return res.status(400).json({ message: 'Invalid City identification ID path format parameter.' });
        }

        const loggedInTenantId = req.user.tenantId;
        const { id, tenantId, ...updatableFields } = req.body;

        const updatedCity = await cityService.updateCity(
            targetCityId, 
            loggedInTenantId, 
            updatableFields
        );

        return res.status(200).json(updatedCity); // ✅ 200 OK Status
    } catch (error: any) {
        return res.status(400).json({ 'message': 'City update failed: ' + error.message });
    }
});


 
export default router;