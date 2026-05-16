// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getProgramRepository } from '../../dependencies'; // <--- Get the service via getter
import { CreateProgramDto,UpdateProgramDto } from '../../Models/Program.interfaces';


const router = Router();

    
router.route('')
.post(async (req: Request<{}, {}, CreateProgramDto>, res: Response) => {
    try {
        const programService = getProgramRepository(); // <--- Get the singleton instance from dependencies.ts

        // Basic validation
        if (!req.body.tenantId ||!req.body.programCode ||!req.body.programName
              ) {
       
           console.log('Basic validation fail like tenantid, programcode, programname missing');
           
        }

   
        const program = await programService.createProgram(req.body);

        res.status(201).json(program);
    } catch (error: any) {
        console.error('Program creation failed:', error.message || error);
        res.status(400).json({ 'message': 'Program creation failed: ' + error.message });
    }
})

// --- PUT & DELETE: Endpoints targeting a specific program by ID ---
router.route('/:id')
// --- PUT: Update a program by ID ---
.put(async (req: Request<{ id: string }, {}, UpdateProgramDto>, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid program ID.' });
        }

        const programService = getProgramRepository();
        const updatedProgram = await programService.updateProgram(id, req.body);

        res.status(200).json(updatedProgram);
    } catch (error: any) {
        console.error('Program update failed:', error.message || error);
        if (error.message === 'Program not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: 'Program update failed: ' + error.message });
    }
})

// --- DELETE: Delete a program by ID ---
.delete(async (req: Request<{ id: string }>, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid program ID.' });
        }

        const programService = getProgramRepository();
        await programService.deleteProgram(id);

        // A 204 No Content response is a standard way to indicate a successful DELETE request
        // with no response body.
        res.status(204).send();
    } catch (error: any) {
        console.error('Program deletion failed:', error.message || error);
        if (error.message === 'Program not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: 'Program deletion failed: ' + error.message });
    }
});

    router.route('/:id/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            const programService = getProgramRepository(); // <--- Get the singleton instance from dependencies.ts
            var activeTenantId=req.params.ptenantId?.toString();
         
        
            const programs = await programService.getPrograms(activeTenantId!);//pass tenantId here as parameter
          
            res.status(200).json(programs);
        } catch (error: any) {
            console.error('Failed to retrieve programs:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve programs: " + error.message });
        }
    });
 
    
router.route('/:id')
    .get(async (req: Request<{ id: string }>, res: Response) => {
        try {
           
            const programService = getProgramRepository(); // <--- Get the singleton instance from dependencies.ts
            const programId = parseInt(req.params.id, 10);
            if (isNaN(programId)) {
            //    return res.status(400).json({ message: 'Invalid Program ID format.' });
            }
            
            const program = await programService.getById(programId);
            
            if (program) {            
               
                res.status(200).json(program);
            } else {
                res.status(404).json({ 'message': 'Program not found.' });
            }
        } catch (error: any) {
            console.error('Failed to retrieve program by ID:', error.message || error);
            res.status(500).json({ 'message': 'Error retrieving program.' });
        }
    })
//     .put(async (req: Request<{ id: string }, {}, UpdateProgramDTO>, res: Response) => { //UpdateProgramRequestBody
//         const programId = parseInt(req.params.id, 10);
//         if (isNaN(programId)) {
//           //  return res.status(400).json({ message: 'Invalid Program ID format.' });
//         }
//         try {
                   
//             const programService = getProgramRepository(); // <--- Get the singleton instance from dependencies.ts
//             const updatedProgram = await programService.updateProgram(programId, req.body);
//             if (updatedProgram) {
//                 res.status(200).json(program);
//             } else {
//                 res.status(404).json({ 'message': 'Program not found for update.' });
//             }
//         } catch (error: any) {
//             console.error('Program update failed:', error.message || error);
//             res.status(400).json({ 'message': 'Program update failed: ' + error.message });
//         }
//     })
//     .delete(async (req: Request<{ id: string }>, res: Response) => {
//         const programId = parseInt(req.params.id, 10);
//         if (isNaN(programId)) {
//            // return res.status(400).json({ message: 'Invalid Program ID format.' });
//         }
//         try {
//             const programService = getProgramRepository(); // <--- Get the singleton instance from dependencies.ts
//             await programService.deleteProgram(programId);
//             res.status(204).send();
//         } catch (error: any) {
//             console.error('Program deletion failed:', error.message || error);
//             res.status(500).json({ 'message': 'Program deletion failed: ' + error.message });
//         }
//     });

export default router;