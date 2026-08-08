import { Router, Request, Response } from 'express';
import { getProductUomConversionRepository} from '../../dependencies'
import PriceCalculationService from '../../services/PriceCalculationEngine';
import { AppDataSource } from '../../../data-source';
//import { site_table_fields } from '../../entity/site_table_fields';
//import { site_table_fields_tenantwise } from '../../entity/site_table_fields_tenantwise';


interface CreateProductUomConversionRequestBody{
    tenantId:number,
    [key:string]:any;
   
}
const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    
    try {
        const productUomConversionService = getProductUomConversionRepository(); // Attempt to get the service
      
        next();
    } catch (error: any) {
        console.error('ProductUomConversionService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. ProductUomConversion service not ready.' });
    }
}); 




    router.route('/:tenantId/:pProductId/:pProductVariantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            var tenantId= parseInt( req.params.tenantId);        
            var productId=parseInt(req.params.pProductId);
             var productVariantId=parseInt(req.params.pProductVariantId);
            const productUomConversionService = getProductUomConversionRepository(); 
            
       
        
            const aProductUomConversion = await productUomConversionService.getProductUomConversion(tenantId,productId,productVariantId);
            console.log(' m returning :',aProductUomConversion);
            
            res.status(200).json(aProductUomConversion);
        } catch (error: any) {
            console.error('Failed to retrieve a site:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a site: " + error.message });
        }
    });

    router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
                             
            const productUomConversionService = getProductUomConversionRepository(); // <--- Get the singleton instance from dependencies.ts
           var tenantId=parseInt(req.params.tenantId)
             var productId= parseInt( req.query?.productId?.toString()!);
                     var productVariantId=parseInt(req.query?.productVariantId?.toString()!)

        console.log('m in getsites productId:',productId);
        console.log('m in getsites productVariantId:',productVariantId);
            const sites = await productUomConversionService.getProductUomConversions(tenantId!,productId!,productVariantId!);
            // In a multi-tenant app, this should usually be filtered by the requesting site's tenantId.
            // Example: const sites = await productUomConversionService.getProductUomConversionsByTenant(req.tenantId);
            //var sites2=sites.filter(usr=>roles?.includes(usr.role.rolename))
            res.status(200).json(sites);
        } catch (error: any) {
            console.error('Failed to retrieve sites:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve sites: " + error.message });
        }
    });


router.route('')
    .post(async (req: Request<{}, {}, CreateProductUomConversionRequestBody>, res: Response) => {
        try {
            const productUomConversionService = getProductUomConversionRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            // if (!req.body.siteName ||!req.body.siteContactPerson
            //       ) {
            //     console.log('Basic validation fail like site name, base_price missing');
            // }
          //  if (req.body.role && !Object.values(userRole).includes(req.body.role)) {
               //  return res.status(400).json({ message: `Invalid user role: ${req.body.Role}` });
          // }

          console.log('.........................................................usercontext body:',req.body);

         // const { tenantId,siteName } = req.body;
            const site = await productUomConversionService.createProductUomConversion(req.body);

            // Remove sensitive data (like password) before sending to client
            //const { password, ...userResponse } = user;//pending-password must be skipped here
            //res.status(201).json(userResponse);
            res.status(201).json(site);
        } catch (error: any) {
            console.error('User creation failed:', error.message || error);
            res.status(400).json({ 'message': 'User creation failed: ' + error.message });
        }
    })

 
export default router;