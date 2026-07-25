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
  
    

export default router;