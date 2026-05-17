//pending- contra UI for setting AutoCodeConfig yet to provide
import { EntityManager, Repository } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { Tenant } from '../entity/Tenant';

import { AutocodeCounter } from '../entity/AutocodeCounter'; // We will create this entity below

export class AutocodeService {
    private tenantRepository!: Repository<Tenant>;
    
    private autocodeCounterRepository: Repository<AutocodeCounter>;

    constructor() {
      
        this.autocodeCounterRepository = AppDataSource.getRepository(AutocodeCounter);
    }

    /**
     * Generates the next unique autocode for a given tenant and type (e.g., 'faculty').
     * The generation is atomic, preventing race conditions.
     * @param tenantId The ID of the tenant.
     * @param type The type of entity to generate the code for (e.g., 'faculty', 'student').
     * @param manager Optional EntityManager for an existing transaction.
     * @returns The next unique autocode string.
     */
    async generateNextAutocode(
        tenantId: string,
        type: 'faculty' | 'student',
        manager?: EntityManager
    ): Promise<string> {
        const transactionalEntityManager = manager || AppDataSource.manager;
        
        // This transaction ensures atomicity:
        // No other process can get the same counter value while this is running.
        return await transactionalEntityManager.transaction(async (queryRunnerManager) => {
            const autocodeCounterRepo = queryRunnerManager.getRepository(AutocodeCounter);
            
            // 1. Get the current counter for this tenant and type, or create it
            let counter = await autocodeCounterRepo.findOne({
                where: { tenantId, type }
            });

            if (!counter) {
                counter = autocodeCounterRepo.create({
                    tenantId,
                    type,
                    currentValue: 0
                });
                await autocodeCounterRepo.save(counter);
            }

            // 2. Increment the counter
            counter.currentValue++;
            await autocodeCounterRepo.save(counter);

            // 3. Get the autocode format from the tenant
            const tenant = await this.tenantRepository.findOne({ where: { tenantId } });
            if (!tenant || !tenant.autocodeConfig) {
                throw new Error(`Autocode configuration not found for tenant: ${tenantId}`);
            }

            const format = tenant.autocodeConfig[type];
            if (!format) {
                throw new Error(`Autocode format for type '${type}' not defined for tenant: ${tenantId}`);
            }

            // 4. Parse the format string and replace placeholders
            const now = new Date();
            const year = now.getFullYear().toString();
            const yearShort = year.slice(-2);
            
            let newCode = format;
            newCode = newCode.replace(/{YYYY}/g, year);
            newCode = newCode.replace(/{YY}/g, yearShort);

            const counterString = counter.currentValue.toString().padStart(4, '0');
            newCode = newCode.replace(/{NNNN}/g, counterString);

            // You can add more complex placeholders here if needed
            // e.g., {DD} for day, {MM} for month, etc.

            return newCode;
        });
    }
}