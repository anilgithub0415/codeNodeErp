import { Router, Request, Response } from 'express';
import { getVendorRepository} from '../../dependencies'
import PriceCalculationService from '../../services/PriceCalculationService';
import { AppDataSource } from '../../../data-source';


interface CreateVendorRequestBody{
    tenantId:number,
    vendorName:string,
    
}
const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    
    try {
        const vendorService = getVendorRepository(); // Attempt to get the service
      
        next();
    } catch (error: any) {
        console.error('VendorService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Vendor service not ready.' });
    }
}); 




    router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            
            
            var tenantId= parseInt( req.params.tenantId);        
            var prodId=parseInt(req.params.id);
            const vendorService = getVendorRepository(); 
            
        
            const aVendor = await vendorService.getVendor(tenantId,prodId);
            res.status(200).json(aVendor);
        } catch (error: any) {
            console.error('Failed to retrieve a vendor:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a vendor: " + error.message });
        }
    });

    router.route('/')
    .get(async (req: Request, res: Response) => {
        try {
            
            console.log('vendor cntr giving vendors');
        
            
            const vendorService = getVendorRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId= parseInt( req.query?.activeTenantId?.toString()!);
                     
        console.log('m in getvendors activeTenantId:',activeTenantId);
        
            const vendors = await vendorService.getVendors(activeTenantId!);
            // In a multi-tenant app, this should usually be filtered by the requesting vendor's tenantId.
            // Example: const vendors = await vendorService.getVendorsByTenant(req.tenantId);
            //var vendors2=vendors.filter(usr=>roles?.includes(usr.role.rolename))
            res.status(200).json(vendors);
        } catch (error: any) {
            console.error('Failed to retrieve vendors:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve vendors: " + error.message });
        }
    });


 
export default router;