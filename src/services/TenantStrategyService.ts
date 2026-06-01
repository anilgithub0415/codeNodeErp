// src/services/TenantService.ts
// Use ES Module imports consistently
import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method
import { TenantStrategy } from '../entity/TenantStrategy';

//import { generateUUID } from '../utils/uuid'; // Assuming you put generateUUID here
import { generateUUID} from '../Utilities/Utility'


class TenantStrategyService {
    private tenantStrategyRepository!: Repository<TenantStrategy>;
    

    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the TenantService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Tenant.
     */
    async init(tenantStrategyRepo: Repository<TenantStrategy>): Promise<void> {
        this.tenantStrategyRepository = tenantStrategyRepo;
        
        console.log("TenantStrategyService repositories initialized.");
    }

    getTenantStrategies = async (ptenantId:number): Promise<TenantStrategy[]> => { // Or Observable<EnumOption[]>
        if (!this.tenantStrategyRepository) {
            throw new Error("tenantStrategyRepository repository not initialized. Call init() first.");
        }
        return await this.tenantStrategyRepository.find({where:{tenantId:ptenantId}});

    }

}


export default TenantStrategyService;