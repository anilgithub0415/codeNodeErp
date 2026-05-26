import { Router, Request, Response } from 'express';
import { getProduct_tableServiceRepository,getProductRepository} from '../../dependencies'

interface CreateProductRequestBody{
    tenantId:string,
    prodName:string,
    description:string
    sku:string
    basePrice:number
}
const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    
    try {
        const productService = getProductRepository(); // Attempt to get the service
      
        next();
    } catch (error: any) {
        console.error('ProductService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Product service not ready.' });
    }
}); 


// get ussert table fields
router.route('/product_table_fields')
.get(async (req: Request, res: Response) => {
    try {   
    

        const producttableService = getProduct_tableServiceRepository();
        const product_table_fields = await producttableService.get_product_table_fields();
        res.status(200).json(product_table_fields); 
    } catch (error: any) {
        console.error('Failed to retrieveproduct_table_fields:', error.message || error);
        res.status(500).json({ message: 'Failed to retrieve product_table_fields.' });
    }
});

    router.route('/')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const productService = getProductRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
                     
        
            const products = await productService.getProducts('1');
            // In a multi-tenant app, this should usually be filtered by the requesting product's tenantId.
            // Example: const products = await productService.getProductsByTenant(req.tenantId);
            //var products2=products.filter(usr=>roles?.includes(usr.role.rolename))
            res.status(200).json(products);
        } catch (error: any) {
            console.error('Failed to retrieve products:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve products: " + error.message });
        }
    });


router.route('')
    .post(async (req: Request<{}, {}, CreateProductRequestBody>, res: Response) => {
        try {
            const productService = getProductRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.prodName ||!req.body.basePrice
                  ) {
               
               console.log('Basic validation fail like product name, base_price missing');
               
            }
          //  if (req.body.role && !Object.values(userRole).includes(req.body.role)) {
               //  return res.status(400).json({ message: `Invalid user role: ${req.body.Role}` });
          // }

          console.log('.........................................................usercontext body:',req.body);

          const { tenantId,prodName, description, sku, basePrice } = req.body;
            const product = await productService.createProduct(req.body);

            // Remove sensitive data (like password) before sending to client
            //const { password, ...userResponse } = user;//pending-password must be skipped here
            //res.status(201).json(userResponse);
            res.status(201).json(product);
        } catch (error: any) {
            console.error('User creation failed:', error.message || error);
            res.status(400).json({ 'message': 'User creation failed: ' + error.message });
        }
    })
export default router;