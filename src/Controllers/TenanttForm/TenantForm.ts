import { Router, Request, Response } from 'express';
// Import the specific getter for TenantService
import { getTenantFormServiceRepository} from '../../dependencies'; // Corrected getter name

import { generateUUID } from '../../Utilities/Utility';// Assuming generateUUID is here
import { BackendCreateTenantDto } from '../../dto/tenant.dto';

// Define an interface for the expected request body for creating a tenant
interface CreateTenantRequestBody {
    tenantName: string;
    tenantType: string; // Use the enum type
    subscriptionPlan?: string; // Use the enum type, optional
}

// Define an interface for the expected request body for updating a tenant
// This should match your TenantUpdateDTO from the service
interface UpdateTenantRequestBody {
    tenantName?: string;
    tenantType?: string;
    subscriptionPlan?: string;
    isActive?: boolean;
    // ... add any other updatable fields from TenantUpdateDTO
}

const router = Router();

// Middleware to ensure tenantService is available
router.use((req, res, next) => {
    // In a real app, you'd probably have an Auth middleware before this
    // to check if the user has permission to manage tenants.
    try {
        const tenantFormService = getTenantFormServiceRepository(); // Attempt to get the service
        next();
    } catch (error: any) {
        console.error('TenantFormService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Tenant service not ready.' });
    }
});


// GET: Fetch full configurations list scoped under target Tenant space
router.route('/:tenantId').get(async (req: Request, res: Response) => {
    try {
        const formConfigsService = getTenantFormServiceRepository();
        const tenantId = parseInt(req.params.tenantId, 10);
                     
        const configs = await formConfigsService.getTenantFormConfigs(tenantId);
        return res.status(200).json(configs);
    } catch (error: any) {
        console.error('Failed to parse active tenant form configs:', error.message || error);
        return res.status(500).json({ message: "Failed to locate active form config listings: " + error.message });
    }
 });

    router.route('/:tenantId/:formKey')
    .get(async (req: Request, res: Response) => {
        try {
       
            
            const tenantId= parseInt( req.params.tenantId);
            const formKey=req.params.formKey;  

            const tenantFormService = getTenantFormServiceRepository();

                 
            const aForm = await tenantFormService.getTenantForm(tenantId,formKey,); 
             


            res.status(200).json(aForm); 
        } catch (error: any) {
            console.error('Failed to retrieve subscription plans:', error.message || error);
            res.status(500).json({ message: 'Failed to retrieve subscription plans.' });
        }
    }) 
  

    // POST: New form JSON
    router.route('/:tenantId').post(async (req: Request, res: Response) => {
        try {
            const formConfigsService = getTenantFormServiceRepository();
          
            const paramsTenantId = parseInt(req.params.tenantId, 10);
    
          
    
            const { id, tenantId, ...updatableFields } = req.body;
    
            const updatedConfig = await formConfigsService.createFormConfig( 
                paramsTenantId,
                updatableFields
            );
    
            return res.status(200).json(updatedConfig); 
        } catch (error: any) {
            return res.status(400).json({ message: 'Form configuration update operation processing failure: ' + error.message });
        }
    });

    
    // PUT: Modify details on existing item matching ownership parameters
    router.route('/:tenantId/:id').put(async (req: Request, res: Response) => {
        try {
            const formConfigsService = getTenantFormServiceRepository();
            const targetId = parseInt(req.params.id, 10);
            const paramsTenantId = parseInt(req.params.tenantId, 10);
    
            if (isNaN(targetId)) {
                return res.status(400).json({ message: 'Invalid target identifier syntax provided.' });
            }
    
            const { id, tenantId, ...updatableFields } = req.body;
    
            const updatedConfig = await formConfigsService.updateFormConfig(
                targetId, 
                paramsTenantId,
                updatableFields
            );
    
            return res.status(200).json(updatedConfig); 
        } catch (error: any) {
            return res.status(400).json({ message: 'Form configuration update operation processing failure: ' + error.message });
        }
    });

export default router;