import { Router, Request, Response } from 'express';
import { getCustomerServiceRepository} from '../../dependencies'


interface CreateCustomerRequestBody{
    tenantId:number;
    customerName:string;
    customerCategory:string;
    createdByUserId?:string;
}
const router = Router();

    router.route('/')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const customerService = getCustomerServiceRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=parseInt(req.query?.activeTenantId?.toString()!);
                     
        console.log('m in getcustomers activeTenantId:',activeTenantId);
        
            const customers = await customerService.getCustomers( activeTenantId!);
             res.status(200).json(customers);
        } catch (error: any) {
            console.error('Failed to retrieve customers:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve customers: " + error.message });
        }
    });


router.route('')
    .post(async (req: Request<{}, {}, CreateCustomerRequestBody>, res: Response) => {
        try {
            const customerService = getCustomerServiceRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.customerName ||!req.body.customerCategory
                  ) {
               
               console.log('Basic validation fail like customer name, category missing');
               
            }
          

          console.log('.........................................................usercontext body:',req.body);

        //  const { tenantId,prodName, description, sku, basePrice } = req.body;
            const customer = await customerService.createCustomer(req.body);

            // Remove sensitive data (like password) before sending to client
            //const { password, ...userResponse } = user;//pending-password must be skipped here
            //res.status(201).json(userResponse);
            res.status(201).json(customer);
        } catch (error: any) {
            console.error('User creation failed:', error.message || error);
            res.status(400).json({ 'message': 'User creation failed: ' + error.message });
        }
    })

 
export default router;