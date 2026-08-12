import { Router, Request, Response } from 'express';
import { getCustomerServiceRepository} from '../../dependencies'


interface CreateCustomerRequestBody{
    id:number;
    tenantId:number;
    customerName:string;customer_autocode:string;
   

    clientStatus:string; 
    leadSource:string;
    [key:string]:any;
}
const router = Router();

router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const customerService = getCustomerServiceRepository(); // <--- Get the singleton instance from dependencies.ts
            var tenantId=parseInt(req.params.tenantId);
             var custId=parseInt(req.params.id);           
                     
        
        
            const customer = await customerService.getCustomer( tenantId!,custId);
             res.status(200).json(customer);
        } catch (error: any) {
            console.error('Failed to retrieve customers:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve customers: " + error.message });
        }
    });

    router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const customerService = getCustomerServiceRepository(); // <--- Get the singleton instance from dependencies.ts
           
            var tenantId=parseInt(req.params.tenantId);
                     
        
        
            const customers = await customerService.getCustomers( tenantId!);
             res.status(200).json(customers);
        } catch (error: any) {
            console.error('Failed to retrieve customers:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve customers: " + error.message });
        }
    });
    
    // =========================================================================
// POST: REGISTER A NEW CUSTOMER (Strict Creation Route)
// =========================================================================
router.route('').post(async (req: Request, res: Response) => {
    try {

             
        // Resolve the singleton instance cleanly from your dependency container
        const customerService = getCustomerServiceRepository();

        if (!req.body.customerName) {
            return res.status(400).json({ message: 'Customer Name is required for creation.' }); 
        }

        // Overwrite and sanitize incoming body payload properties
        const secureCustomerPayload = {
            ...req.body,
            tenantId: req.user.tenantId,       // Enforce strict token multi-tenant separation
            createdByUserId: req.user.id       // Injected immutable audit log tracking signature
        };


        const customer = await customerService.createCustomerClean(secureCustomerPayload);
        return res.status(201).json(customer); // ✅ 201 Created Status
    } catch (error: any) {
        return res.status(400).json({ message: 'Database creation transaction failed: ' + error.message });
    }
});

// =========================================================================
// PUT: MODIFY AN EXISTING CUSTOMER RECORD (Strict Update Route)
// =========================================================================
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
              
        // Resolve the singleton instance cleanly from your dependency container
        const customerService = getCustomerServiceRepository();
        
        const targetCustomerId = parseInt(req.params.id, 10);
        if (isNaN(targetCustomerId)) {
            return res.status(400).json({ message: 'Invalid customer configuration tracking code parameter path.' });
        }

        const loggedInTenantId = req.user.tenantId;

        // Strip structural variables out of client payload body context 
        const { id, tenantId, ...updatableFields } = req.body;

        // Execute mutation passing the token's authenticated tenant boundary parameter
        const updatedCustomer = await customerService.updateCustomer(
            targetCustomerId,
            loggedInTenantId,
            updatableFields
        );

        return res.status(200).json(updatedCustomer); // ✅ 200 OK Status
    } catch (error: any) {
        return res.status(400).json({ message: 'Database update transaction failed: ' + error.message });
    }
});



 
export default router;