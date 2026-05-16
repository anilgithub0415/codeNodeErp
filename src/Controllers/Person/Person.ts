// src/Controllers/User/User_1.ts
import { Router, Request, Response } from 'express';
// Import the specific getter for UserService from dependencies.ts
import { getPersonRepository } from '../../dependencies'; // <--- Get the service via getter


import { UpdateUserDTO } from '../../dto/CreateUser.dto';
import { UpdatePersonDTO } from '../../dto/CreatePerson.dto';
//import personService from '../../services/PersonService';

// Define interfaces for request bodies
interface CreatePersonRequestBody {
    firstName?:string;
    lastName?:string;
    contactEmail?:string;
    contactPhone?:string;
    dateOfBirth?:Date;
    gender?:string;
    addressLine1?:string;
    addressLine2?:string;
    city?:string;
    state?:string;
    zipCode?:string;
    country?:string;
}

interface UpdatePersonRequestBody {
    firstName?:string;
    lastName?:string;
    contactEmail?:string;
    contactPhone?:string;
    dateOfBirth?:Date;
    gender?:string;
    addressLine1?:string;
    addressLine2?:string;
    city?:string;
    state?:string;
    zipCode?:string;
    country?:string;
}

const router = Router();

router.use((req, res, next) => {   
    try {
        const personService = getPersonRepository(); // Attempt to get the service
        // You could attach it to res.locals or req for later use if desired,
        // but directly calling the getter in each route is also fine.
        next();
    } catch (error: any) {
        console.error('personService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Person service not ready.' });
    }
});  


router.route('')
    .post(async (req: Request<{}, {}, CreatePersonRequestBody>, res: Response) => {
        try {
            
            const personService = getPersonRepository(); // <--- Get the singleton instance from dependencies.ts

            // Basic validation
            if (!req.body.firstName || !req.body.contactEmail ) {
               // return res.status(400).json({ message: 'User Name, Role, and Tenant ID are required for user creation.' });
            }
          //  if (req.body.role && !Object.values(userRole).includes(req.body.role)) {
               //  return res.status(400).json({ message: `Invalid user role: ${req.body.Role}` });
          // }

            const person = await personService.CreatePerson(req.body);

            
            res.status(201).json(person);
        } catch (error: any) {
            console.error('User creation failed:', error.message || error);
            res.status(400).json({ 'message': 'User creation failed: ' + error.message });
        }
    })
    router.route('/')
    .get(async (req: Request, res: Response) => {
        console.log('...................yes person list getting called...........');
        
        try {
            
            const personService = getPersonRepository(); // <--- Get the singleton instance from dependencies.ts
        
            var persons = await personService.getPersons();
            
            // In a multi-tenant app, this should usually be filtered by the requesting user's tenantId.
            // Example: const persons = await personService.getUsersByTenant(req.tenantId);
           // var persons2=persons.filter(usr=>roles?.includes(usr.role.rolename))

           //skip mine record as a person
           persons=persons.filter(p=>p.contactEmail!=='anilkoli@gmail.com')
           
            res.status(200).json(persons);
        } catch (error: any) {
            console.error('Failed to retrieve persons:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve persons: " + error.message });
        }
    });

    router.route('/:id')
    .put(async (req: Request<{ id: string }, {}, UpdatePersonDTO>, res: Response) => { //UpdateUserRequestBody
        const  personId = parseInt(req.params.id, 10);
        if (isNaN(personId)) {
          //  return res.status(400).json({ message: 'Invalid User ID format.' });
        }
        try {
                   
            const personService = getPersonRepository(); // <--- Get the singleton instance from dependencies.ts
            const updatedPerson = await personService.updatePerson(personId, req.body);
            if (updatedPerson) {
                        res.status(200).json(updatedPerson);
            } else {
                res.status(404).json({ 'message': 'Person not found for update.' });
            }
        } catch (error: any) {
            console.error('Person update failed:', error.message || error);
            res.status(400).json({ 'message': 'Person update failed: ' + error.message });
        }
    })

export default router;