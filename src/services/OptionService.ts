// src/services/OptionService.ts
// Use ES Module imports consistently
import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method
import { Option } from '../entity/Option'; // Import Option entity and its enums
import { option,CreateOptionDto, UpdateOptionDto  } from '../Models/Question.interfaces';
//import {CreateOptionDto, UpdateOptionDto}from '../Models/Option'



//import { BackendUpdateOptionDto } from '../dto/tenant.dto';
// Or: import { generateUUID } from '../Special/helpers'; // If you put it here


class OptionService {
    private optionRepository!: Repository<Option>; // Will be set by init method
    
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the OptionService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Option.
     */
    async init(optionRepo: Repository<Option>,
        
        ): Promise<void> {
        this.optionRepository = optionRepo;
        
        console.log("OptionService repositories initialized.");
    }

   
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param optionDto The DTO containing the data for the new option.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created Option.
     */
    async createOption(optionDto: CreateOptionDto, manager?: EntityManager): Promise<Option> {
        // This is a concise and correct way to get the right repository.
        const repo = manager ? manager.getRepository(Option) : this.optionRepository;

        // --- THIS IS THE KEY LINE TO AVOID MANUAL ASSIGNMENT ---
        // TypeORM's `create` method takes a plain object (our DTO) and returns a new
        // entity instance with all the properties correctly mapped.
        const newOption = repo.create(optionDto);
                
        return repo.save(newOption);
    }


    /**
     * Updates an existing Option with the given data.
     * @param id The ID of the option to update.
     * @param optionDto The DTO containing the data for the option update.
     * @returns A Promise of the updated Option entity.
     */
    async updateOption(id: number, optionDto: UpdateOptionDto): Promise<Option> {
        const option = await this.optionRepository.findOneBy({ id });
        
        if (!option) {
            throw new Error('Option not found');
        }

        // Object.assign is a great way to merge the DTO properties into the entity.
        // It avoids manual, property-by-property assignment.
        Object.assign(option, optionDto);

        return this.optionRepository.save(option);
    }
    /**
     * Retrieves all Option records from the database.
     * @returns An array of Option entities.
     */
    

    
    async getById(id: number
        ,manager?: EntityManager): Promise<Option | undefined> {
                     
        if (!this.optionRepository) {
            throw new Error("OptionService repository not initialized. Call init() first.");
        }
        const optionRepository = manager ? manager.getRepository(Option) : this.optionRepository;
        
        var aoption = await optionRepository.findOne({
            where: { id: id }
            
           
        });

        if (aoption) {
            return aoption;
        }
        return undefined;
    }


}



export default OptionService;