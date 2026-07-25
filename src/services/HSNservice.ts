import { EntityManager, Repository } from 'typeorm';
import { HsnTaxRule } from '../entity/HsnTaxRule';
import { AppDataSource } from '../../data-source'; 

interface CreateHsnTaxRuleDto {
    hsnCode: string;
    description: string;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    [key: string]: any;
}

export interface CreatedHsnTaxRuleResponse {
    hsnTaxRule: HsnTaxRule;
}

export class HsnTaxRuleService {
    private hsnTaxRuleRepository!: Repository<HsnTaxRule>;

    /**
     * Initializes the HsnTaxRuleService with its TypeORM repository instance.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param hsnTaxRuleRepo The TypeORM Repository instance for HsnTaxRule.
     */
    async init(hsnTaxRuleRepo: Repository<HsnTaxRule>): Promise<void> {
        this.hsnTaxRuleRepository = hsnTaxRuleRepo;
        console.log("HsnTaxRuleService repository initialized.");       
    }

    async getHsnTaxRule(
        pHsnCode: string,        
        manager?: EntityManager
    ): Promise<HsnTaxRule> {
        
        if (!this.hsnTaxRuleRepository) {
            throw new Error("HsnTaxRuleService repository not initialized. Call init() first.");
        }
        
        const hsnTaxRuleRepository = manager ? manager.getRepository(HsnTaxRule) : this.hsnTaxRuleRepository;
        const taxRule = await hsnTaxRuleRepository.findOne({ where: { hsnCode: pHsnCode } }); 
        
        return taxRule!; 
    }

    async getHsnTaxRules(
        manager?: EntityManager
    ): Promise<HsnTaxRule[]> {
        
        if (!this.hsnTaxRuleRepository) {
            throw new Error("HsnTaxRuleService repository not initialized. Call init() first.");
        }
        
        const hsnTaxRuleRepository = manager ? manager.getRepository(HsnTaxRule) : this.hsnTaxRuleRepository;
        const taxRules = await hsnTaxRuleRepository.find(); 
        
        
        return taxRules;
    }

    /**
     * Creates a new HsnTaxRule or updates an existing one if the hsnCode matches.
     *
     * @param createDto Data for creating/updating the HsnTaxRule.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created/updated HsnTaxRule entity wrapper.
     */
    async createHsnTaxRule(
        createDto: CreateHsnTaxRuleDto,
        manager?: EntityManager
    ): Promise<CreatedHsnTaxRuleResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const hsnRepo = queryRunner!.manager.getRepository(HsnTaxRule);
            
            let newORexistingRule: HsnTaxRule;
            let aTaxRule = await hsnRepo.findOne({ where: { hsnCode: createDto.hsnCode } });
           
            if (aTaxRule) {
                console.log(`found hsn code with name: ${createDto.hsnCode}`);
                Object.assign(aTaxRule, createDto);  
                newORexistingRule = aTaxRule;
                console.log('updating:', aTaxRule);
                await hsnRepo.save(aTaxRule); 
            } else {
                let newRule = hsnRepo.create(createDto);
                newORexistingRule = newRule;
                await hsnRepo.save(newRule);  
            }

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return { hsnTaxRule: newORexistingRule };

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createHsnTaxRule:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }
}
           
export default HsnTaxRuleService;
