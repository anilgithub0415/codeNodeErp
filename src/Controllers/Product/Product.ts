import { Router, Request, Response } from 'express';
import { getProductRepository, getProductTemplateRepository} from '../../dependencies'
import PriceCalculationService from '../../services/PriceCalculationService';
import { AppDataSource } from '../../../data-source';
//import { product_table_fields } from '../../entity/product_table_fields';
//import { product_table_fields_tenantwise } from '../../entity/product_table_fields_tenantwise';


interface CreateProductRequestBody{
    tenantId:number,
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
// router.route('/product_table_fields/:id')
// .get(async (req: Request, res: Response) => {
//     try {   
    
//         //product_table_fields
//         const tenantId=parseInt(req.params.id);
//         const prodtblflds  = await AppDataSource
//         .getRepository(product_table_fields)
//         .createQueryBuilder('product_table_fields')
//         .getMany();

//         //product_table_fields_tenantwise
//         const tenatprodtblflds = await AppDataSource
//         .getRepository(product_table_fields_tenantwise)
//         .createQueryBuilder('product_table_fields_tenantwise')
//         .where("product_table_fields_tenantwise.tenantId= :tenantId",{tenantId})
//         .getMany();

//         //both results made union and returned
//         const unionArray = [...prodtblflds, ...tenatprodtblflds]

//         res.status(200).json(unionArray); 
        
//     } catch (error: any) {
//         console.error('Failed to retrieveproduct_table_fields:', error.message || error);
//         res.status(500).json({ message: 'Failed to retrieve product_table_fields.' });
//     }
// });


    router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            
            var tenantId= parseInt( req.params.tenantId);        
            var prodId=parseInt(req.params.id);
            const productService = getProductRepository(); 
            
        
            const aProduct = await productService.getProduct(tenantId,prodId);
            res.status(200).json(aProduct);
        } catch (error: any) {
            console.error('Failed to retrieve a product:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a product: " + error.message });
        }
    });

    router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
                 
            const productService = getProductRepository(); // <--- Get the singleton instance from dependencies.ts
           var tenantId=parseInt(req.params.tenantId);
                     
       
        
            const products = await productService.getProducts(tenantId!);
            // In a multi-tenant app, this should usually be filtered by the requesting product's tenantId.
            // Example: const products = await productService.getProductsByTenant(req.tenantId);
            //var products2=products.filter(usr=>roles?.includes(usr.role.rolename))
            res.status(200).json(products);
        } catch (error: any) {
            console.error('Failed to retrieve products:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve products: " + error.message });
        }
    });

    //withvariant
    router.route('/withvariant/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const productTempService = getProductTemplateRepository(); // <--- Get the singleton instance from dependencies.ts
         var tenantId=parseInt(req.params.tenantId);
                     
        
        
            const products = await productTempService.getProductTemplates(tenantId!);
            // In a multi-tenant app, this should usually be filtered by the requesting product's tenantId.
            // Example: const products = await productService.getProductsByTenant(req.tenantId);
            //var products2=products.filter(usr=>roles?.includes(usr.role.rolename))
            res.status(200).json(products);
        } catch (error: any) {
            console.error('Failed to retrieve products:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve products: " + error.message });
        }
    });

//Note: custId treated as number tenantId treated as string

    router.route('/finalPrice/:id/:tenantId/:custId')
    .post(async (req: Request, res: Response) => {
        try {
            var p=req.body;
            console.log('i got p:',p);
            
        var prodId= parseInt(req.params.id);
            var tenantId= parseInt( req.params.tenantId);
            var custId= parseInt(req.params.custId);

            const priceCalcService = new PriceCalculationService(); // <--- Get the singleton instance from dependencies.ts
            
            var finalPrice=await priceCalcService.calculateFinalPrice(tenantId,prodId,custId,p)

            res.status(200).json(finalPrice);
        } catch (error: any) {
            console.error('Failed to calculatefinalprice of product:', error.message || error);
            res.status(500).json({ "message": "Failed to calculatefinalprice of product: " + error.message });
        }
    });

    router.route('')
    .post(async (req: Request<{}, {}, CreateProductRequestBody>, res: Response) => {
        try {
            const productService = getProductRepository();

            // 1. Basic validation (with explicit early return on failure)
            if (!req.body.prodName || !req.body.basePrice) {
               console.log('Basic validation fail: product name or base_price missing');
               return res.status(400).json({ message: 'Product name and base price are required.' });
            }

            // 2. EXTRACT FROM DECODED JWT (Enforces backend data isolation authority)
            const loggedInTenantId = req.user.tenantId; 
            const loggedInUserId = req.user.id; // Or req.user.userId depending on token payload configuration

            // 3. OVERWRITE FRONTEND INJECTIONS FOR BULLETPROOF SECURITY
            const secureProductPayload = {
                ...req.body,
                tenantId: loggedInTenantId,       // Enforce token tenant isolation
                createdByUserId: loggedInUserId    // Injected audit trail stamp
            };

            console.log('.........................................................Sanitised Payload Context Body:');
            console.log(secureProductPayload);

            // 4. Pass sanitized payload directly to your repository/service pipeline
            const product = await productService.createProduct(secureProductPayload);

            // 5. Semantic HTTP response (201 Created for new resource generation)
            res.status(201).json(product);
        } catch (error: any) {
            console.error('Product creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Product creation failed: ' + error.message });
        }
    });

router.route('/withvariant')
    .post(async (req: Request<{}, {}, CreateProductRequestBody>, res: Response) => {
        try {
            const productTempService = getProductTemplateRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.prodName ||!req.body.basePrice
                  ) {
               
               console.log('Basic validation fail like product name, base_price missing');
               
            }
          //  if (req.body.role && !Object.values(userRole).includes(req.body.role)) {
               //  return res.status(400).json({ message: `Invalid user role: ${req.body.Role}` });
          // }

          console.log('.........................................................posting withvariant body:',req.body);

          const { tenantId,prodName, description, sku, basePrice } = req.body;
            const product = await productTempService.createProductTemplate(req.body);

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