import { Router, Request, Response } from 'express';
// Import the specific getter for TenantService
import { getTenantServiceRepository } from '../../dependencies'; // Corrected getter name

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
        const tenantService = getTenantServiceRepository(); // Attempt to get the service
        next();
    } catch (error: any) {
        console.error('TenantService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Tenant service not ready.' });
    }
});


router.route('/:id/ptenantId/:ptenantId')
   
    .get(async (req: Request, res: Response) => {
        try {
            
            
            const tenantService = getTenantServiceRepository(); // Get the singleton instance
            const tenants = await tenantService.getTenants(req.params.ptenantId);
            res.status(200).json(tenants); // 200 OK for successful GET
        } catch (error: any) {
            console.error('Failed to retrieve tenants:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve Tenants: " + error.message });
        }
    });

    router.route('/types')
    .get(async (req: Request, res: Response) => {
        try {
            console.log('getTenantTypes');
            
            // Assuming TenantService has a method to get types from TenantTypeLookupRepository
            const tenantService = getTenantServiceRepository();
            const types = await tenantService.getTenantTypes(); // This method needs to be implemented in TenantService
            res.status(200).json(types.map(t => t.typeName)); // Send back just the string names
        } catch (error: any) {
            console.error('Failed to retrieve tenant types:', error.message || error);
            res.status(500).json({ message: 'Failed to retrieve tenant types.' });
        }
    });
    router.route('/plans')
    .get(async (req: Request, res: Response) => {
        try {
            // Assuming TenantService has a method to get plans from SubscriptionPlanLookupRepository
            
            const tenantService = getTenantServiceRepository();
            const plans = await tenantService.getSubscriptionPlans(); // This method needs to be implemented in TenantService
            res.status(200).json(plans.map(p => p.planName)); // Send back just the string names
        } catch (error: any) {
            console.error('Failed to retrieve subscription plans:', error.message || error);
            res.status(500).json({ message: 'Failed to retrieve subscription plans.' });
        }
    })
router.route('')
.post(async (req: Request<{}, {}, CreateTenantRequestBody>, res: Response) => { // Type the request body
    try {
        
        
        const tenantService = getTenantServiceRepository(); // Get the singleton instance
        // Call CreateTenant on the singleton instance
        const tenant = await tenantService.CreateTenant(req.body);

        res.status(201).json(tenant); // 201 Created for successful POST
    } catch (error: any) {
        console.error('Tenant creation failed:', error.message || error);
        res.status(400).json({ 'message': error.message });
    }
})
router.route('/:id')
    .get(async (req: Request, res: Response) => {
        try {
            const tenantService = getTenantServiceRepository(); // Get the singleton instance
            const tenant = await tenantService.getTenant(req.params.id);
            if (tenant) {
                res.status(200).json(tenant);
            } else {
                res.status(404).json({ 'message': 'Tenant not found.' }); // Return 404 if not found
            }
        } catch (error: any) {
            console.error('Failed to retrieve tenant by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving tenant.' });
        }
    }) 
  
    .put(async (req: Request<{ id: string }, {}, BackendCreateTenantDto>, res: Response) => { // Type params and body
        const id = req.params.id;
        // No need for if(!id) throw new Error, Express handles missing params in routes with :id
        try {
            const tenantService = getTenantServiceRepository(); // Get the singleton instance
            const updatedTenant = await tenantService.updateTenant(id, req.body);
            if (updatedTenant) {
                res.status(200).json(updatedTenant);
            } else {
                res.status(404).json({ 'message': 'Tenant not found for update.' });
            }
        } catch (error: any) {
            console.error('Tenant update failed:', error.message || error);
            res.status(400).json({ 'message': 'Tenant update failed: ' + error.message });
        }
    })
    .delete(async (req: Request, res: Response) => { // Add a delete route
        try {
            const tenantService = getTenantServiceRepository(); // Get the singleton instance
            await tenantService.deleteTenant(req.params.id);
            res.status(204).send(); // 204 No Content for successful deletion
        } catch (error: any) {
            console.error('Tenant deletion failed:', error.message || error);
            res.status(500).json({ 'message': 'Tenant deletion failed: ' + error.message });
        }
    });



export default router;