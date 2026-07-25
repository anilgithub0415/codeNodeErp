import { EntityManager, Repository } from 'typeorm';
import { SubscriptionPlanLookup } from '../entity/SubscriptionPlanLookup';
import { AppDataSource } from '../../data-source'; 

interface CreateSubscriptionPlanDto {
    planName: string;
    [key: string]: any;
}

export interface CreatedSubscriptionPlanResponse {
    subscriptionPlan: SubscriptionPlanLookup;
}

export class SubscriptionPlanLookupService {
    private subscriptionPlanRepository!: Repository<SubscriptionPlanLookup>;

    /**
     * Initializes the SubscriptionPlanLookupService with its TypeORM repository instance.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param subscriptionPlanRepo The TypeORM Repository instance for SubscriptionPlanLookup.
     */
    async init(subscriptionPlanRepo: Repository<SubscriptionPlanLookup>): Promise<void> {
        this.subscriptionPlanRepository = subscriptionPlanRepo;
        console.log("SubscriptionPlanLookupService repository initialized.");       
    }

    async getSubscriptionPlan(
        pPlanName: string,        
        manager?: EntityManager
    ): Promise<SubscriptionPlanLookup> {
        
        if (!this.subscriptionPlanRepository) {
            throw new Error("SubscriptionPlanLookupService repository not initialized. Call init() first.");
        }
        
        const subscriptionPlanRepository = manager ? manager.getRepository(SubscriptionPlanLookup) : this.subscriptionPlanRepository;
        const plan = await subscriptionPlanRepository.findOne({ where: { planName: pPlanName } }); 
        
        return plan!; 
    }

    async getSubscriptionPlans(
        manager?: EntityManager
    ): Promise<SubscriptionPlanLookup[]> {
        
        if (!this.subscriptionPlanRepository) {
            throw new Error("SubscriptionPlanLookupService repository not initialized. Call init() first.");
        }
        
        const subscriptionPlanRepository = manager ? manager.getRepository(SubscriptionPlanLookup) : this.subscriptionPlanRepository;
        const plans = await subscriptionPlanRepository.find(); 
        
        return plans;
    }

    /**
     * Creates a new SubscriptionPlan or updates an existing one if the planName matches.
     *
     * @param createDto Data for creating/updating the SubscriptionPlan.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created/updated SubscriptionPlan entity wrapper.
     */
    async createSubscriptionPlan(
        createDto: CreateSubscriptionPlanDto,
        manager?: EntityManager
    ): Promise<CreatedSubscriptionPlanResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const planRepo = queryRunner!.manager.getRepository(SubscriptionPlanLookup);
            
            let newORexistingPlan: SubscriptionPlanLookup;
            let aPlan = await planRepo.findOne({ where: { planName: createDto.planName } });
           
            if (aPlan) {
                console.log(`found subscription plan with name: ${createDto.planName}`);
                Object.assign(aPlan, createDto);  
                newORexistingPlan = aPlan;
                console.log('updating:', aPlan);
                await planRepo.save(aPlan); 
            } else {
                let newPlan = planRepo.create(createDto);
                newORexistingPlan = newPlan;
                await planRepo.save(newPlan);  
            }

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return { subscriptionPlan: newORexistingPlan };

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createSubscriptionPlan:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }
}
           
export default SubscriptionPlanLookupService;
