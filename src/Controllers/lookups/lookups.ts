// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import {    getCityRepository, getCustomerCategoryServiceRepository, getCustomerServiceRepository, getDiscountTypeRepository, getHSNRepository, getLeadSourceServiceRepository, getProductCategoryRepository, getProductRepository, getProductTemplateRepository, getSubscriptionPlanLookupRepository, getTenantTypeRepository, getUserRepository, getVendorRepository } from '../../dependencies'; // <--- Get the service via getter
import { Leadsource } from '../../entity/LeadSource';

interface FirmTypeLookup {
  label: string | number; 
  value: string | number;
  // add other known properties here
}

const router = Router();


     
  //custcategoriesTypes
    router.route('/customerCategoryTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        
        try {
            
            const customerCategoryService = getCustomerCategoryServiceRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=parseInt( req.params.ptenantId?.toString());

        
            const customerCategoryTypes = await customerCategoryService.getCustomerCategories(activeTenantId);//pass tenantId here as parameter
            var customerCategoryTypesAsLookup=customerCategoryTypes.map(item => {
                const {  customerCategory } = item; // Destructure to extract id and name
                return { label: customerCategory, value:customerCategory };      // Return a new object with only id and name
              });

                 
            res.status(200).json(customerCategoryTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve customerCategoryTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve customerCategoryTypes: " + error.message });
        }
    });
//customerTypes
router.route('/customerTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        
        try {
            
            const customerService = getCustomerServiceRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=parseInt( req.params.ptenantId?.toString());

        
            const customerTypes = await customerService.getCustomers(activeTenantId);//pass tenantId here as parameter
            var customerTypesAsLookup=customerTypes.map(item => {
                const {  customerName,id } = item; // Destructure to extract id and name
                return { label: customerName, value:id };      // Return a new object with only id and name
              });

                 
            res.status(200).json(customerTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve customerTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve customerTypes: " + error.message });
        }
    });
    

//customerWithFirmTypes
router.route('/customerWithFirmTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        
        try {
            
            const customerService = getCustomerServiceRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=parseInt( req.params.ptenantId?.toString());

        
            const customers = await customerService.getCustomers(activeTenantId);//pass tenantId here as parameter
            var customerWithFirmTypesAsLookup:FirmTypeLookup[]=[];
            customers.map(aCust => { 
          
                // const {  customerName,id } = item; // Destructure to extract id and name
                // return { label: customerName, value:id };      // Return a new object with only id and name
                      if (aCust.sites && aCust.sites.length > 0) {
                                aCust.sites.forEach(aOrg =>{ 
const orgWidth = 22;
const categoryWidth = 10;
const customerWidth = 20; 
const paddedOrg = aOrg.siteName.padEnd(orgWidth, '_');
//const paddedCategory = aOrg.customerCategoryId.toString().padEnd(categoryWidth, 'b');
const paddedCustomer = aCust.customerName.padEnd(customerWidth, 'c');

                         customerWithFirmTypesAsLookup.push({
                           label: `${aOrg.siteName} - ${aCust.customerCategoryId} - (${aCust.customerName})`,
                            value:aOrg.id
                         })
                         
                        })



                      }

              });

                 
            res.status(200).json(customerWithFirmTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve customerTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve customerTypes: " + error.message });
        }
    });

    //roleTypes
    router.route('/roleTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
                
        try {
            
            const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts
           var activeTenantId=parseInt( req.params.ptenantId?.toString());

            const roleTypes = await userService.getUserRoles(activeTenantId);//pass tenantId here as parameter
            var roleTypesAsLookup=roleTypes.map(item => {
                const {  rolename } = item; // Destructure to extract id and name
                return { label: rolename, value:rolename };      // Return a new object with only id and name
              });

              
              
            res.status(200).json(roleTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve roleTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve roleType: " + error.message });
        }
    });
    //tenantTypes
    router.route('/tenantTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
                
        try {
            
            const tenantTypeService = getTenantTypeRepository(); // <--- Get the singleton instance from dependencies.ts
           
            const tenantTypes = await tenantTypeService.getTenantTypes();//pass tenantId here as parameter
            var tenantTypesAsLookup=tenantTypes.map(item => {
                const {  typeName } = item; // Destructure to extract id and name
                return { label: typeName, value:typeName };      // Return a new object with only id and name
              });

              
              
            res.status(200).json(tenantTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve tenantTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve roleType: " + error.message });
        }
    });

    //subscriptionTypes
    router.route('/subscriptionTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
                
        try {
            
            const subscriptionTypeService = getSubscriptionPlanLookupRepository(); // <--- Get the singleton instance from dependencies.ts
           
            const subscriptionTypes = await subscriptionTypeService.getSubscriptionPlans();//pass tenantId here as parameter
            var subscriptionTypesAsLookup=subscriptionTypes.map(item => {
                const {  planName } = item; // Destructure to extract id and name
                return { label: planName, value:planName };      // Return a new object with only id and name
              });

              
              
            res.status(200).json(subscriptionTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve subscriptionTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve roleType: " + error.message });
        }
    });

//productTypes use this for flat product
    router.route('/productTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
             
        try {
            
            const productService = getProductRepository(); // <--- Get the singleton instance from dependencies.ts
           var activeTenantId=parseInt( req.params.ptenantId?.toString());

            const productTypes = await productService.getProducts(activeTenantId);//pass tenantId here as parameter
            var productTypesAsLookup=productTypes.map(item => {
                const {  prodName,id } = item; // Destructure to extract id and name
                return { label: prodName, value:id };      // Return a new object with only id and name
              });

              
              
            res.status(200).json(productTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve productTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve productType: " + error.message });
        }
    });
//productTypesWithVariants use this for variants
 router.route('/productTypesWithVariants/ptenantId/:ptenantId')
    router.route('/productTypesWithVariants/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        console.log('this is productTypesWithVariants get');
        
        try {
            const productTemplService = getProductTemplateRepository();
           var activeTenantId=parseInt( req.params.ptenantId?.toString());

            const productTypes = await productTemplService.getProductTemplates(activeTenantId);
            
            // Create lookup array with product-variants combinations
            var productTypesAsLookup = [];
            
            for (const item of productTypes) {
                // Add each variant as a separate entry in the lookup
                if (item.variants && item.variants.length > 0) {
                    item.variants.forEach(variant => {
                        productTypesAsLookup.push({
                            label: `${item.prodName} - ${variant.sku} (${variant.size || ''})`,
                            value: variant.id,
                            productId: item.id,
                            productName: item.prodName,
                            variantSku: variant.sku,
                            variantSize: variant.size,
                            variantFinish: variant.finish,
                            basePrice: variant.basePrice,
                            currentStock: variant.currentstock,
                            // Include other variant properties as needed
                        });
                    });
                } else {
                    // If no variants, add the product itself
                    productTypesAsLookup.push({
                        label: item.prodName,
                        value: item.id,
                        productId: item.id,
                        productName: item.prodName,
                        variantSku: null,
                        variantSize: null,
                        variantFinish: null,
                       // basePrice: item.basePrice,
                        //currentStock: item.currentstock
                    });
                }
            }
              
              
            res.status(200).json(productTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve productTypesWithVariants:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve productTypesWithVariants: " + error.message });
        }
    });

  //productCetegoriesTypes
    router.route('/productCetegoryTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        
        try {
            
            const productCetegoryService = getProductCategoryRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=parseInt( req.params.ptenantId?.toString());

        
            const productCetegoryTypes = await productCetegoryService.getCategories(activeTenantId);//pass tenantId here as parameter
            var productCetegoryTypesAsLookup=productCetegoryTypes.map(item => {
                const {  id,categoryName } = item; // Destructure to extract id and name
                return { label: categoryName, value:categoryName };      // Return a new object with only id and name
              });

                 
            res.status(200).json(productCetegoryTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve productCetegoryTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve productCetegoryTypes: " + error.message });
        }
    });
    
    router.route('/discountStrategyTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        
        
        try {
            
            const discountTypeService = getDiscountTypeRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=parseInt( req.params.ptenantId?.toString());

            const discountTypes = await discountTypeService.getDiscountTypes(activeTenantId);//pass tenantId here as parameter
            var discountTypeServiceAsLookup=discountTypes.map(item => {
                const {  id,typeName } = item; // Destructure to extract id and name
                return { label: typeName, value: id};      // Return a new object with only id and name
              });

              
              
            res.status(200).json(discountTypeServiceAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve leadSourceTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve leadSourceType: " + error.message });
        }
    });

    //InteractionChannelTypes
    router.route('/InteractionChannelTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        
        
        try {
            
            var InteractionChannel=[
                  { label: 'Phone', value: 'Phone'},
                  { label: 'Email', value: 'Email'},
                  { label: 'Whatsapp', value: 'Whatsapp'},
                  { label: 'Visit', value: 'Visit'}
                ]
              
              
            res.status(200).json(InteractionChannel);
        } catch (error: any) {
            console.error('Failed to retrieve leadSourceTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve leadSourceType: " + error.message });
        }
    });
    //InteractionPurposeTypes
    router.route('/InteractionPurposeTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        
      
        try {
            
            var InteractionPurpose=[{ label: 'Sample Feedback', value: 'Sample Feedback'},
                                    { label: 'Price Negotiation', value: 'Price Negotiation'}, 
                                    {label:'Payment Follow-up', value: 'Payment Follow-up'}]
              
              
            res.status(200).json(InteractionPurpose);
              
            res.status(200).json(InteractionPurpose);
        } catch (error: any) {
            console.error('Failed to retrieve leadSourceTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve leadSourceType: " + error.message });
        }
    });

    //leadSourceTypes
    router.route('/leadSourceTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        
        
        try {
            
            const leadSourceService = getLeadSourceServiceRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=parseInt( req.params.ptenantId?.toString());

            const leadSourceTypes = await leadSourceService.getLeadsources(activeTenantId);//pass tenantId here as parameter
            var leadSourceTypesAsLookup=leadSourceTypes.map(item => {
                const {  leadSource } = item; // Destructure to extract id and name
                return { label: leadSource, value:leadSource };      // Return a new object with only id and name
              });

              
              
            res.status(200).json(leadSourceTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve leadSourceTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve leadSourceType: " + error.message });
        }
    });


//vendorTypes
    router.route('/vendorTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
                
        try {
            
            const vendorService = getVendorRepository(); // <--- Get the singleton instance from dependencies.ts
           var activeTenantId=parseInt( req.params.ptenantId?.toString());

            const vendorTypes = await vendorService.getVendors(activeTenantId);//pass tenantId here as parameter
            var vendorTypesAsLookup=vendorTypes.map(item => {
                const {  vendorName,id } = item; // Destructure to extract id and name
                return { label: vendorName, value:id };      // Return a new object with only id and name
              });

              
              
            res.status(200).json(vendorTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve vendorTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve vendorType: " + error.message });
        }
    });


//customerMobileTypes
    router.route('/customerMobileTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
                
        try {
            
            const custService = getCustomerServiceRepository(); // <--- Get the singleton instance from dependencies.ts
           var activeTenantId=parseInt( req.params.ptenantId?.toString());

            const customerMobileTypes = await custService.getCustomers(activeTenantId);//pass tenantId here as parameter
            var customerMobileTypesAsLookup=customerMobileTypes.map(item => {
                const {  commercialContactPhone,id } = item; // Destructure to extract id and name
                return { commercialContactPhone: commercialContactPhone, value:id };      // Return a new object with only id and name
              });

              
              
            res.status(200).json(customerMobileTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve customerMobileTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve vendorType: " + error.message });
        }
    });



//customerEmailIdTypes
    router.route('/customerEmailIdTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
                
        try {
            
            const custService = getCustomerServiceRepository(); // <--- Get the singleton instance from dependencies.ts
           var activeTenantId=parseInt( req.params.ptenantId?.toString());

            const customerEmailIdTypes = await custService.getCustomers(activeTenantId);//pass tenantId here as parameter
            var customerEmailIdTypesAsLookup=customerEmailIdTypes.map(item => {
                const {  EmailId,id } = item; // Destructure to extract id and name
                return { EmailId: EmailId, value:id };      // Return a new object with only id and name
              });

              
              
            res.status(200).json(customerEmailIdTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve customerEmailIdTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve vendorType: " + error.message });
        }
    });

//hsnTypes
    router.route('/hsnTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
                              
        try {
            
            const hsnService = getHSNRepository(); // <--- Get the singleton instance from dependencies.ts
          

            const hsnTypes = await hsnService.getHsnTaxRules();//pass tenantId here as parameter
            // var hsnTypesAsLookup=hsnTypes.map(item => {
            //     const {  description,id } = item; // Destructure to extract id and name
            //     return { label: description, value:id };      // Return a new object with only id and name
            //   });
var hsnTypesAsLookup:any=[];
hsnTypes.map(item => {
                const {  hsnCode,description,id } = item; // Destructure to extract id and name
               // return { label: description, value:id };      // Return a new object with only id and name
               hsnTypesAsLookup.push({label: `${item.hsnCode} - ${item.description} `,
                        value: item.id})
              });
              
              
            res.status(200).json(hsnTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve hsnTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve hsnType: " + error.message });
        }
    });


//cityTypes
    router.route('/cityTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
                
        try {
            
            const cityService = getCityRepository(); 
           var activeTenantId=parseInt( req.params.ptenantId?.toString());

            const cityTypes = await cityService.getCitys(activeTenantId);
            var cityTypesAsLookup=cityTypes.map(item => {
                const {  cityName,id } = item; 
                return { label: cityName, value:id }; // saving city id
              });

              
              
            res.status(200).json(cityTypesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve cityTypes:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve cityType: " + error.message });
        }
    });

export default router;