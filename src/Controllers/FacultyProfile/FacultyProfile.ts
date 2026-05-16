// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getFacultyProfileRepository } from '../../dependencies'; // <--- Get the service via getter
import { CreateFacultyProfileDto, UpdateFacultyProfileDto } from '../../Models/FacultyProfile.interfaces';


const router = Router();
router.route('')
    .post(async (req: Request<{}, {}, CreateFacultyProfileDto>, res: Response) => {
        try {
            const FacultyProfileService = getFacultyProfileRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.tenantId ||!req.body.personId ||!req.body.employeeIdNumber 
                  ) {
           
               console.log('Basic validation fail like tenantid, PersonId, employeeIdNumber missing');
               
            }
  
       
            const FacultyProfile = await FacultyProfileService.createFacultyProfile(req.body);

            res.status(201).json(FacultyProfile);
        } catch (error: any) {
            console.error('FacultyProfile creation failed:', error.message || error);
            res.status(400).json({ 'message': 'FacultyProfile creation failed: ' + error.message });
        }
    })

// --- PUT & DELETE: Endpoints targeting a specific FacultyProfile by ID ---
router.route('/:id')
    // --- PUT: Update a FacultyProfile by ID ---
    .put(async (req: Request<{ id: string }, {}, UpdateFacultyProfileDto>, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid FacultyProfile ID.' });
            }

            const FacultyProfileService = getFacultyProfileRepository();
            const updatedFacultyProfile = await FacultyProfileService.updateFacultyProfile(id, req.body);

            res.status(200).json(updatedFacultyProfile);
        } catch (error: any) {
            console.error('FacultyProfile update failed:', error.message || error);
            if (error.message === 'FacultyProfile not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: 'FacultyProfile update failed: ' + error.message });
        }
    })

    // --- DELETE: Delete a FacultyProfile by ID ---
    .delete(async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid FacultyProfile ID.' });
            }

            const FacultyProfileService = getFacultyProfileRepository();
            await FacultyProfileService.deleteFacultyProfile(id);

            // A 204 No Content response is a standard way to indicate a successful DELETE request
            // with no response body.
            res.status(204).send();
        } catch (error: any) {
            console.error('FacultyProfile deletion failed:', error.message || error);
            if (error.message === 'FacultyProfile not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: 'FacultyProfile deletion failed: ' + error.message });
        }
    });
    router.route('/')
    .get(async (req: Request, res: Response) => {
        console.log('....gtting FacultyProfiles.........');
        
        try {
            
            const FacultyProfileService = getFacultyProfileRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.query?.activeTenantId?.toString();
         
        console.log(' and activetenantid is:',activeTenantId);
        
            const FacultyProfiles = await FacultyProfileService.getFacultyProfiles(activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(FacultyProfiles);
        } catch (error: any) {
            console.error('Failed to retrieve FacultyProfiles:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve FacultyProfiles: " + error.message });
        }
    });
 
router.route('/:id/:personid')
    .get(async (req: Request<{ id: string, personid:string }>, res: Response) => {
        try {
           
            const FacultyProfileService = getFacultyProfileRepository(); // <--- Get the singleton instance from dependencies.ts
            const FacultyProfileId = parseInt(req.params.id, 10);
            const PersonId = parseInt(req.params.personid, 10);

            if (isNaN(FacultyProfileId)) {
            //    return res.status(400).json({ message: 'Invalid FacultyProfile ID format.' });
            }
            
            const FacultyProfile = await FacultyProfileService.getById(FacultyProfileId,PersonId);
            
            if (FacultyProfile) {            
               
                res.status(200).json(FacultyProfile);
            } else {
                res.status(404).json({ 'message': 'FacultyProfile not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve FacultyProfile by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving FacultyProfile.' });
        }
    })

    

//     .put(async (req: Request<{ id: string }, {}, UpdateFacultyProfileDTO>, res: Response) => { //UpdateFacultyProfileRequestBody
//         const FacultyProfileId = parseInt(req.params.id, 10);
//         if (isNaN(FacultyProfileId)) {
//           //  return res.status(400).json({ message: 'Invalid FacultyProfile ID format.' });
//         }
//         try {
                   
//             const FacultyProfileService = getFacultyProfileRepository(); // <--- Get the singleton instance from dependencies.ts
//             const updatedFacultyProfile = await FacultyProfileService.updateFacultyProfile(FacultyProfileId, req.body);
//             if (updatedFacultyProfile) {
//                 res.status(200).json(FacultyProfile);
//             } else {
//                 res.status(404).json({ 'message': 'FacultyProfile not found for update.' });
//             }
//         } catch (error: any) {
//             console.error('FacultyProfile update failed:', error.message || error);
//             res.status(400).json({ 'message': 'FacultyProfile update failed: ' + error.message });
//         }
//     })
    .delete(async (req: Request<{ id: string }>, res: Response) => {
        const FacultyProfileId = parseInt(req.params.id, 10);
        if (isNaN(FacultyProfileId)) {
           // return res.status(400).json({ message: 'Invalid FacultyProfile ID format.' });
        }
        try {
            const FacultyProfileService = getFacultyProfileRepository(); // <--- Get the singleton instance from dependencies.ts
            await FacultyProfileService.deleteFacultyProfile(FacultyProfileId);
            res.status(204).send();
        } catch (error: any) {
            console.error('FacultyProfile deletion failed:', error.message || error);
            res.status(500).json({ 'message': 'FacultyProfile deletion failed: ' + error.message });
        }
    });

export default router;