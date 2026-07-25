import { EntityManager, Repository } from 'typeorm';
import { AppDataSource } from '../../data-source'; 
import { ClientRequirement } from '../entity/ClientRequirement';
import { ClientRequirementItem, RequirementFrequency } from '../entity/ClientRequirementItem';
import { Customer } from '../entity/Customer'; // Import Customer Entity

export interface ICreateClientRequirementItemInput {
    productCategory: string;
    productName: string;
    approxQuantity: number;
    unit: string;
    frequency?: RequirementFrequency;
}

// 1. UPDATED DTO: Added mandatory clientId
interface CreateClientRequirementDto {
    tenantId: number;
    clientId: number; // Linked field added here
    createdByUserId?: number;
    specialRequirement?: string | null;
    packingRequirement?: string | null;
    deliveryRequirement?: string | null;
    expectedBudget?: number;
    monthlyBudget?: number;
    remarksNotes?: string | null;
    items: ICreateClientRequirementItemInput[];
    [key: string]: any;
}

export interface CreatedClientRequirementResponse {
    clientRequirement: ClientRequirement;
}

export class ClientRequirementService {
    private clientRequirementRepository!: Repository<ClientRequirement>;

    async init(clientRepo: Repository<ClientRequirement>): Promise<void> {
        this.clientRequirementRepository = clientRepo;
        console.log("ClientRequirementService repository initialized.");       
    }

    /**
     * Fetch a single client requirement by tracking ID and tenant boundaries
     */
    async getClientRequirement(tenantId: number, id: number): Promise<ClientRequirement> {
        const result = await this.clientRequirementRepository.findOne({
            where: { id, tenantId },
            relations: ['items', 'client'] // 2. Eager-load client entity records
        });
        if (!result) {
            throw new Error(`Client Requirement tracking record ID ${id} not discovered for tenant ${tenantId}.`);
        }
        return result;
    }

    /**
     * List all requirements stored inside a dynamic tenant context boundary
     */
    // Update your service method file
async getClientRequirements(tenantId: number, clientId?: number): Promise<ClientRequirement[]> {
    // 1. Build the base query criteria matching the active tenant scope
    const queryConditions: any = { tenantId };

    // 2. 💡 DYNAMIC RANGE EXPANSION: Append clientId query constraint if explicitly supplied
    if (clientId !== undefined && !isNaN(clientId)) {
        queryConditions.client = { id: clientId }; 
        // Note: If your entity matches a flat column key 'clientId' instead of a relation, 
        // use: queryConditions.clientId = clientId;
    }
console.log('.........................queryConditions.......................:,queryConditions');

    return await this.clientRequirementRepository.find({
        where: queryConditions,
        relations: ['items', 'client'], // Eager-load client entity records
        order: { createdAt: 'DESC' }
    });
}


    /**
     * Creates a fresh client requirement or handles idempotency rules using managed transactions.
     */
    async createClientRequirementClean(
        createDto: CreateClientRequirementDto,
        manager?: EntityManager
    ): Promise<CreatedClientRequirementResponse> {
        console.log('createDto for client requirement initialized:', createDto);
        
        const isExternalTransaction = !!manager;
        const txManager = isExternalTransaction ? manager! : AppDataSource.manager;
        let queryRunner: any = null;

        try {
            if (!isExternalTransaction) {
                queryRunner = AppDataSource.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.startTransaction();
            }

            const activeManager = isExternalTransaction ? txManager : queryRunner.manager;

            const clientReqRepo = activeManager.getRepository(ClientRequirement);
            const clientItemRepo = activeManager.getRepository(ClientRequirementItem);
            const customerRepo = activeManager.getRepository(Customer); // Get customer repository

            // 4. PRE-FLIGHT VALIDATION: Verify Customer context boundaries
            const targetCustomer = await customerRepo.findOne({
                where: { id: createDto.clientId, tenantId: createDto.tenantId }
            });
            if (!targetCustomer) {
                throw new Error(`Customer ID ${createDto.clientId} does not exist under Tenant ID ${createDto.tenantId}.`);
            }

            let targetRequest: ClientRequirement;

            // Updated structural check: handles overwrite mechanics bound by matching tenant and client ID
            let existingRequest = await clientReqRepo.findOne({ 
                where: { 
                    tenantId: createDto.tenantId,
                    clientId: createDto.clientId // 5. Include clientId in lookups
                } 
            });

            // --- VALIDATE AND BUILD INDIVIDUAL ITEM LINES ---
            const structuredItems: ClientRequirementItem[] = [];

            for (const itemInput of (createDto.items || [])) {
                const itemNode = new ClientRequirementItem();
                
                itemNode.productCategory = itemInput.productCategory;
                itemNode.productName = itemInput.productName;
                itemNode.approxQuantity = Number(itemInput.approxQuantity || 0.00);
                itemNode.unit = itemInput.unit;
                itemNode.frequency = itemInput.frequency || RequirementFrequency.ONE_TIME;

                structuredItems.push(itemNode);
            }

            // --- EXECUTE DB WRITE PIPELINE CONTEXTS ---
            if (existingRequest && createDto.id) { 
                console.log(`Modifying existing target requirement ID: ${existingRequest.id}`);
                
                await clientItemRepo.delete({ clientRequirementId: existingRequest.id });

                clientReqRepo.merge(existingRequest, createDto);
                existingRequest.items = structuredItems;
                targetRequest = await clientReqRepo.save(existingRequest);
                
            } else {
                console.log(`Generating fresh Client Requirement configuration block`);
                
                const newRequest = clientReqRepo.create(createDto);
                newRequest.items = structuredItems;
                
                targetRequest = await clientReqRepo.save(newRequest);
            }

            if (!isExternalTransaction && queryRunner) {
                await queryRunner.commitTransaction();
            }

            return { clientRequirement: targetRequest };

        } catch (error) {
            if (!isExternalTransaction && queryRunner) {
                await queryRunner.rollbackTransaction();
            }
            console.error('Error encountered inside createClientRequirementClean:', error);
            throw error;
        } finally {
            if (!isExternalTransaction && queryRunner) {
                await queryRunner.release();
            }
        }
    }

    /**
     * Modifies an unfinished master layout configuration matching the targeted update params.
     */
    async updateClientRequirement(
        targetId: number, 
        tenantId: number, 
        updatableFields: Partial<CreateClientRequirementDto>
    ): Promise<ClientRequirement> {
        return await AppDataSource.transaction(async (transactionalEntityManager) => {
            const clientReqRepo = transactionalEntityManager.getRepository(ClientRequirement);
            const clientItemRepo = transactionalEntityManager.getRepository(ClientRequirementItem);
            const customerRepo = transactionalEntityManager.getRepository(Customer);

            // 6. VALIDATION: Check customer record if clientId is being updated
            if (updatableFields.clientId) {
                const targetCustomer = await customerRepo.findOne({
                    where: { id: updatableFields.clientId, tenantId }
                });
                if (!targetCustomer) {
                    throw new Error(`Customer ID ${updatableFields.clientId} does not exist under Tenant ID ${tenantId}.`);
                }
            }

            const existingReq = await clientReqRepo.findOne({
                where: { id: targetId, tenantId },
                relations: ['items']
            });

            if (!existingReq) {
                throw new Error(`Client Requirement with identification ID ${targetId} missing on tenant context.`);
            }

            if (updatableFields.items) {
                await clientItemRepo.delete({ clientRequirementId: targetId });

                const freshlyMappedItems = updatableFields.items.map(itemInput => {
                    const itemNode = new ClientRequirementItem();
                    itemNode.productCategory = itemInput.productCategory;
                    itemNode.productName = itemInput.productName;
                    itemNode.approxQuantity = Number(itemInput.approxQuantity || 0.00);
                    itemNode.unit = itemInput.unit;
                    itemNode.frequency = itemInput.frequency || RequirementFrequency.ONE_TIME;
                    return itemNode;
                });

                existingReq.items = freshlyMappedItems;
            }

            const { items, ...pureFields } = updatableFields;
            clientReqRepo.merge(existingReq, pureFields);

            return await clientReqRepo.save(existingReq);
        });
    }
}
