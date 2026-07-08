import { Router, Request, Response } from 'express';
import { getVendorRepository} from '../../dependencies'
import PriceCalculationService from '../../services/PriceCalculationService';
import { AppDataSource } from '../../../data-source';


interface CreateVendorRequestBody{
    tenantId:number,
    vendorName:string,
    description:string
    
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
            
            
            var tenantId= parseInt( req.params.tenantId as string);        
            var prodId=parseInt(req.params.id as string);
            const vendorService = getVendorRepository(); 
            
        
            const aVendor = await vendorService.getVendor(tenantId,prodId);
            res.status(200).json(aVendor);
        } catch (error: any) {
            console.error('Failed to retrieve a vendor:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a vendor: " + error.message });
        }
    });

    router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            console.log('vendor cntr giving vendors');
        
            
            const vendorService = getVendorRepository(); // <--- Get the singleton instance from dependencies.ts
            var tenantId=parseInt(req.params.tenantId);
                     
        
        
            const vendors = await vendorService.getVendors(tenantId!);
            // In a multi-tenant app, this should usually be filtered by the requesting vendor's tenantId.
            // Example: const vendors = await vendorService.getVendorsByTenant(req.tenantId);
            //var vendors2=vendors.filter(usr=>roles?.includes(usr.role.rolename))
            res.status(200).json(vendors);
        } catch (error: any) {
            console.error('Failed to retrieve vendors:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve vendors: " + error.message });
        }
    });

router.route('')
    .post(async (req: Request<{}, {}, CreateVendorRequestBody>, res: Response) => {
        try {
            const vendorService = getVendorRepository();

            // 1. Basic validation
            if (!req.body.vendorName) {
               console.log('Basic validation fail: vendorName missing');
               return res.status(400).json({ message: 'Vendor name is required' });
            }

            // 2. EXTRACT FROM DECODED JWT (Enforces backend-level authority)
            const loggedInTenantId = req.user.tenantId; 
            const loggedInUserId = req.user.id; // Or req.user.userId depending on your token payload

            // 3. OVERWRITE FRONTEND INJECTIONS FOR BULLETPROOF SECURITY
            const secureVendorPayload = {
                ...req.body,
                tenantId: loggedInTenantId,       // Force token tenant isolation
                createdByUserId: loggedInUserId    // Automatically stamp creating user
            };

            console.log('Hitting secure vendor post processing...');
            console.log(secureVendorPayload);

            // 4. Pass the sanitized payload to your service layer
            const vendor = await vendorService.createVendor(secureVendorPayload);

            res.status(201).json(vendor);
        } catch (error: any) {
            console.error('Vendor creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Vendor creation failed: ' + error.message });
        }
    });

 
export default router;