// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import {   getFacultyProfileRepository, getUserRepository, getTopicRepository } from '../../dependencies'; // <--- Get the service via getter


const router = Router();

     
     

    router.route('/topics/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const topicService = getTopicRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const topics = await topicService.getTopics(activeTenantId!);//pass tenantId here as parameter
            var topicsAsLookup=topics.map(item => {
                const { id, topicName } = item; // Destructure to extract id and name
                return { label: topicName, value:id };      // Return a new object with only id and name
              });
            res.status(200).json(topicsAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve topics:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve topics: " + error.message });
        }
    });

    //facultyProfiles
    router.route('/facultyProfiles/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const facultyProfileService = getFacultyProfileRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const facultyProfiles = await facultyProfileService.getFacultyProfiles(activeTenantId!);//pass tenantId here as parameter
            var facultyProfilesAsLookup=facultyProfiles.map(item => {
                const { id, person,department } = item; // Destructure to extract id and name
                return { label: person.firstName+'-'+person.lastName+' ('+department+')', value:id };      // Return a new object with only id and name
              });
            res.status(200).json(facultyProfilesAsLookup);
        } catch (error: any) {
            console.error('Failed to retrieve facultyProfiles:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve facultyProfiles: " + error.message });
        }
    });



    
    

    
    //roleTypes
    router.route('/roleTypes/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const userService = getUserRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const roleTypes = await userService.getUserRoles();//pass tenantId here as parameter
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

export default router;