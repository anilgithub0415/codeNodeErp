import { Router, Request, Response } from 'express';
import { getTenantRepository_New } from '../../dependencies';

interface CreateTenantRequestBody {
    tenantName: string;
    autocodeConfig?: {
        faculty?: string;
        student?: string;
    };
    tenantTypeName: string;
    subscriptionPlanName: string;
    subscriptionEndDate?: string | null;
    isActive?: boolean;
}

const router = Router();

// Middleware to ensure tenantService is available at run-time
router.use((req, res, next) => {
    try {
        getTenantRepository_New(); // Attempt to verify initialization from dependencies
        next();
    } catch (error: any) {
        console.error('TenantService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Tenant service not ready.' });
    }
}); 

router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            const tenantId = parseInt(req.params.tenantId, 10);        
            const tenantService = getTenantRepository_New(); 
            
            const aTenant = await tenantService.getTenant(tenantId);
            if (!aTenant) {
                return res.status(404).json({ message: 'Tenant not found.' });
            }
            res.status(200).json(aTenant);
        } catch (error: any) {
            console.error('Failed to retrieve a Tenant:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a Tenant: " + error.message });
        }
    });

router.route('')
    .get(async (req: Request, res: Response) => {
        try {
            const tenantService = getTenantRepository_New(); 
            const tenants = await tenantService.getTenants();
            res.status(200).json(tenants);
        } catch (error: any) {
            console.error('Failed to retrieve Tenants:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve Tenants: " + error.message });
        }
    })
    .post(async (req: Request<{}, {}, CreateTenantRequestBody>, res: Response) => {
        try {
            const tenantService = getTenantRepository_New();

            // Basic validation
            if (!req.body.tenantName || !req.body.tenantTypeName || !req.body.subscriptionPlanName) {
               console.log('Basic validation fail: tenantName, tenantTypeName, or subscriptionPlanName missing');
               return res.status(400).json({ message: 'tenantName, tenantTypeName, and subscriptionPlanName are required fields.' });
            }

            console.log('.........................................................tenant body:', req.body);

            const result = await tenantService.createTenant(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            console.error('Tenant creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Tenant creation failed: ' + error.message });
        }
    });

export default router;
