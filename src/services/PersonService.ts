// src/services/PersonService.ts
import { EntityManager, Not, Repository } from 'typeorm';
import { Person } from '../entity/Person';
import { Tenant } from '../entity/Tenant';
import { UpdatePersonDTO } from '../dto/CreatePerson.dto';

// You will likely need a DTO for person creation if you don't use the full entity
interface CreatePersonInternalDTO {
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
    createdByUserId?:number;
}




export class PersonService {
    private personRepository!: Repository<Person>;
   
    constructor() {
        // Constructor is lean, repositories will be set via init
    }

 
    async init(personRepo: Repository<Person> ): Promise<void> {
        this.personRepository = personRepo;
      
        console.log("PersonService repositories initialized.");
    }

    async CreatePerson(personData: CreatePersonInternalDTO
        ,manager?: EntityManager): Promise<Person> {

            console.log('creating person record in personservice');
            
        if (!this.personRepository ) {
            throw new Error("PersonService repositories not initialized. Call init() first.");
        }
        if (!personData.firstName || !personData.contactEmail) {
            throw new Error('Person Name, contactEmail are required.');
        }

       
        const personRepository = manager ? manager.getRepository(Person) : this.personRepository;
       

       
        const newPerson = new Person();
        newPerson.firstName = personData.firstName;
        newPerson.lastName = personData.lastName || null;
        newPerson.contactEmail = personData.contactEmail;
      
console.log('..................................');
        
newPerson.createdByUserId=personData.createdByUserId;
 //pending , assigned personId statically 1
 
       
        console.log('finally adding person:',newPerson);
        return await personRepository.save(newPerson);
    }

    
    async updatePerson(id: number, updateData: UpdatePersonDTO
        ,manager?: EntityManager): Promise<Person | undefined> {//PersonUpdateDTO
            
        if (!this.personRepository) {
            throw new Error("PersonService repository not initialized. Call init() first.");
        }
        const personToUpdate = await this.personRepository.findOne({ where: { id: id } });
        if (!personToUpdate) {
            return undefined;
        }
        const personRepository = manager ? manager.getRepository(Person) : this.personRepository;
        

        Object.assign(personToUpdate, updateData); // Apply other updates

        return await personRepository.save(personToUpdate);
    }

    async getPersonById(id: number, manager?: EntityManager): Promise<Person | null> {

        console.log('....getPersonById:',id);
        
    if (!this.personRepository) {
        throw new Error("personService repository not initialized. Call init() first.");
    }
    const personRepository = manager ? manager.getRepository(Person) : this.personRepository;
    var  aperson = await personRepository.findOne({
        where: { id: id} 
    });
   

    if (aperson) {
        // If the user is found and tenant relation is loaded,
        // 'auser.tenant' will now contain the Tenant object,
        // from which you can access auser.tenant.tenantType.
        return aperson;
    }
    return null;
}

    async getPersonByEmail(email:string, manager?: EntityManager): Promise<Person | null> {

        console.log('....getPersonByEmail:',email);
        
    if (!this.personRepository) {
        throw new Error("personService repository not initialized. Call init() first.");
    }
    const personRepository = manager ? manager.getRepository(Person) : this.personRepository;
    var  aperson = await personRepository.findOne({
        where: { contactEmail: email} 
    });
   

    if (aperson) {
        // If the user is found and tenant relation is loaded,
        // 'auser.tenant' will now contain the Tenant object,
        // from which you can access auser.tenant.tenantType.
        return aperson;
    }
    return null;
}

    // async getPersons_Notinuse(manager?: EntityManager): Promise<Person[]> {
                        
    //     if (!this.personRepository) {
    //         throw new Error("PersonService repository not initialized. Call init() first.");
    //     }

    //     const personRepository = manager ? manager.getRepository(Person) : this.personRepository;

    
        

    //     // Default case: retrieve all persons for the given tenantId
    //     return await personRepository.find({order: {
    //         user:{personId: 'ASC'}
    //       },});

    // }

    
    async getPersons(manager?: EntityManager): Promise<Person[]> {
        console.log('Executing getPersons with custom sorting...');

        const personRepository = manager ? manager.getRepository(Person) : this.personRepository;

        // Define the CASE WHEN expressions for clarity and reusability
        const noTenantContextPriority = `CASE WHEN userTenantContext.id IS NULL THEN 0 ELSE 1 END`;
        const isStudentPriority = `CASE WHEN studentProfile.id IS NOT NULL THEN 0 ELSE 1 END`;

        const persons = await personRepository.createQueryBuilder('person')
            .leftJoinAndSelect('person.user', 'user')
            .leftJoin('user.userTenantContexts', 'userTenantContext') // Join to check for contexts
            .leftJoinAndSelect('person.studentProfile', 'studentProfile')
                        
            // --- FIX: Use the full CASE WHEN expression directly in addOrderBy ---
            .orderBy(noTenantContextPriority, 'ASC') // First, prioritize those with no tenant context
            .addOrderBy(isStudentPriority, 'ASC')     // Then, prioritize students
            .addOrderBy('person.firstName', 'ASC')    // Then, by first name
            .addOrderBy('person.lastName', 'ASC')     // Finally, by last name
            .getMany();

        console.log('getPersons completed. Found', persons.length, 'persons.');
        return persons;
    }
    

}

export default PersonService; // Export the CLASS