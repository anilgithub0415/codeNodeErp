// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import {    getCustomerCategoryServiceRepository, getCustomerServiceRepository, getLeadSourceServiceRepository, getUserRepository } from '../../dependencies'; // <--- Get the service via getter
import { Leadsource } from '../../entity/LeadSource';


const router = Router();


     
  //custcategoriesTypes
    router.route('/customerCategoryTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        console.log('this is cattypes get');
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

    
    //roleTypes
    router.route('/roleTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        console.log('this is rtypes get');
        
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

    //leadSourceTypes
    router.route('/leadSourceTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        console.log('this is leadSources get');
        
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

export default router;