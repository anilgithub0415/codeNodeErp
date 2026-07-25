import { EntityManager, Repository } from 'typeorm';
import { Leadsource } from '../entity/LeadSource';
import { AppDataSource } from '../../data-source'; 

interface CreateLeadsourceDto {
    id?: number;
    tenantId: number;
    leadSource: string;
    createdByUserId?: number;
    [key: string]: any;
}

export interface CreatedLeadsourceResponse {
    leadsource: Leadsource;
}

export class LeadsourceService {
    private leadsourceRepository!: Repository<Leadsource>;

    /**
     * Initializes the LeadsourceService with its TypeORM repository instance.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param leadsourceRepo The TypeORM Repository instance for Leadsource.
     */
    async init(leadsourceRepo: Repository<Leadsource>): Promise<void> {
        this.leadsourceRepository = leadsourceRepo;
        console.log("LeadsourceService repository initialized.");       
    }

    async getLeadsource(
        pId: number,        
        manager?: EntityManager
    ): Promise<Leadsource> {
        
        if (!this.leadsourceRepository) {
            throw new Error("LeadsourceService repository not initialized. Call init() first.");
        }
        
        const leadsourceRepository = manager ? manager.getRepository(Leadsource) : this.leadsourceRepository;
        const leadsource = await leadsourceRepository.findOne({ where: { id: pId } }); 
        
        return leadsource!; 
    }

    // async getLeadsources(
    //     manager?: EntityManager
    // ): Promise<Leadsource[]> {
        
    //     if (!this.leadsourceRepository) {
    //         throw new Error("LeadsourceService repository not initialized. Call init() first.");
    //     }
        
    //     const leadsourceRepository = manager ? manager.getRepository(Leadsource) : this.leadsourceRepository;
    //     const leadsources = await leadsourceRepository.find(); 
        
    //     return leadsources;
    // }

        async getLeadsources(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<Leadsource[]> {

             if (!this.leadsourceRepository) {
                        throw new Error("LeadsourceService repository not initialized. Call init() first.");
                    }
                   
                    
                    const leadSourceRepository = manager ? manager.getRepository(Leadsource) : this.leadsourceRepository;
                    const leadsources= await leadSourceRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all 
                    
                    
                    return leadsources;
                }
    /**
     * Creates a new Leadsource or updates an existing one if the id matches.
     *
     * @param createDto Data for creating/updating the Leadsource.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created/updated Leadsource entity wrapper.
     */
    async createLeadsource(
        createDto: CreateLeadsourceDto,
        manager?: EntityManager
    ): Promise<CreatedLeadsourceResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const leadsourceRepo = queryRunner!.manager.getRepository(Leadsource);
            
            let newORexistingSource: Leadsource;
            let aLeadsource = createDto.id ? await leadsourceRepo.findOne({ where: { id: createDto.id } }) : null;
           
            if (aLeadsource) {
                console.log(`found lead source with id: ${createDto.id}`);
                Object.assign(aLeadsource, createDto);  
                newORexistingSource = aLeadsource;
                console.log('updating:', aLeadsource);
                await leadsourceRepo.save(aLeadsource); 
            } else {
                let newSource = leadsourceRepo.create(createDto);
                newORexistingSource = newSource;
                await leadsourceRepo.save(newSource);  
            }

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return { leadsource: newORexistingSource };

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createLeadsource:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }
}
           
export default LeadsourceService;
