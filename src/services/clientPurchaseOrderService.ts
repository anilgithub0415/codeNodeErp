// import { EntityManager, Repository } from 'typeorm';
// import { AppDataSource } from '../../data-source'; 
// import { ClientPurchaseOrder, POStatus } from '../entity/ClientPurchaseOrder';
// import { ClientPurchaseOrderItem } from '../entity/ClientPurchaseOrderItem';
// import { DocumentSequence } from '../entity/DocumentSequence';

// interface CreateClientPurchaseOrderDto {
//     tenantId: number;siteId:number;
//     clientId: number;
//     clientPoNumber: string;
//     poDate: Date;
//     requestedDeliveryDate?: Date;
//     totalAmount: number;
//     clientNotes?: string;
//     items: {
//         productId: number;
//         quantity: number;
//         finalPrice: number;
//     }[];
//     [key: string]: any;
// }

// export interface CreatedClientPurchaseOrderResponse {
//     clientPurchaseOrder: ClientPurchaseOrder;
// }

// export class ClientPurchaseOrderService {
//     private clientPoRepository!: Repository<ClientPurchaseOrder>;

//     /**
//      * Initializes the ClientPurchaseOrderService with its repository instance.
//      * This MUST be called AFTER AppDataSource.initialize() has completed.
//      */
//     async init(clientPoRepo: Repository<ClientPurchaseOrder>): Promise<void> {
//         this.clientPoRepository = clientPoRepo;
//         console.log("ClientPurchaseOrderService repository initialized.");       
//     }

//     /**
//      * Retrieves all client purchase orders for an active tenant.
//      */
//     async getClientPOs(activeTenantId: number): Promise<ClientPurchaseOrder[]> {
//         return await this.clientPoRepository.find({
//             where: { tenantId: activeTenantId },
//             relations: ['items'],
//             order: { createdAt: 'DESC' }
//         });
//     }

//     /**
//      * Creates or updates a Client Purchase Order inside a database transaction.
//      */async createClientPurchaseOrder(
//     createDto: CreateClientPurchaseOrderDto,
//     manager?: EntityManager
// ): Promise<CreatedClientPurchaseOrderResponse> {

//     console.log('createdto at first..............', createDto);
    
//     const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
//     let shouldReleaseQueryRunner = false;

//     try {
//         if (!manager) {
//             await queryRunner!.connect();
//             await queryRunner!.startTransaction();
//             shouldReleaseQueryRunner = true;
//         }

//         const txManager = queryRunner!.manager;
//         const clientPoRepo = txManager.getRepository(ClientPurchaseOrder);
//         let targetOrder: ClientPurchaseOrder;

//         // Check if PO already exists
//         let existingPo = await clientPoRepo.findOne({ 
//             where: { 
//                 tenantId: createDto.tenantId, 
//                 clientPoNumber: createDto.clientPoNumber,
//                 clientId: createDto.clientId
//             } 
//         });

//         if (existingPo) {
                       
//             // Prevent payload from overwriting the established PO number
//             const { clientPoNumber, ...updateData } = createDto;

//             // Merge data safely into the managed tracking entity
//             clientPoRepo.merge(existingPo, updateData);  
//             targetOrder = existingPo;
            
//         } else {
//             console.log('Generating autonumbering...');
//             const generatedClientPONumber = await this.generateClientPurchaseOrderNumber(txManager, 'B2B');
//             console.log('generatedClientPONumber:', generatedClientPONumber);

//             createDto.clientPoNumber = generatedClientPONumber;

//             console.log(`Creating fresh Client PO: ${createDto.clientPoNumber}`);
//             targetOrder = clientPoRepo.create(createDto);
//         }
        
//         // A single save handles both insert/update and cascade saves items automatically
//         await clientPoRepo.save(targetOrder); 

//         if (shouldReleaseQueryRunner) {
//             await queryRunner!.commitTransaction();
//         }

//         return { clientPurchaseOrder: targetOrder };

//     } catch (error) {
//         if (shouldReleaseQueryRunner) {
//             await queryRunner!.rollbackTransaction();
//         }
//         console.error('Error in createClientPurchaseOrder:', error);
//         throw error;
//     } finally {
//         if (shouldReleaseQueryRunner) {
//             await queryRunner!.release();
//         }
//     }
// }



//     public async generateClientPurchaseOrderNumber(
//     transactionalEntityManager: EntityManager, 
//     channelCode: string = "W"
// ): Promise<string> {
//     console.log('--- START: generateClientPurchaseOrderNumber ---');
    
//     try {
//         const now = new Date();
//         const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
//         const docType = "Client_Purchase_ORDE";
        
//         console.log(`Searching sequence for DocType: ${docType}, YearMonth: ${yearMonth}`);

//         // 1. Fetch sequence entry with an exclusive row lock
//         console.log('Executing database query with pessimistic_write lock...');
//         let sequence = await transactionalEntityManager
//             .getRepository(DocumentSequence)
//             .createQueryBuilder("seq")
//             .setLock("pessimistic_write") 
//             .where("seq.documentType = :docType AND seq.prefixYearMonth = :yearMonth", { docType, yearMonth })
//             .getOne();
        
//         console.log('Database query finished. Sequence found:', !!sequence);

//         let nextValue: number;

//         if (!sequence) {
//             nextValue = 100001;
//             console.log(`No sequence found. Initializing new row with value: ${nextValue}`);
            
//             const newSequence = new DocumentSequence();
//             newSequence.documentType = docType;
//             newSequence.prefixYearMonth = yearMonth;
//             newSequence.currentValue = nextValue;

//             await transactionalEntityManager.save(DocumentSequence, newSequence);
//             console.log('New sequence record saved successfully.');
//         } else {
//             nextValue = sequence.currentValue + 1;
//             console.log(`Sequence found. Incrementing value to: ${nextValue}`);
//             sequence.currentValue = nextValue;
            
//             await transactionalEntityManager.save(DocumentSequence, sequence);
//             console.log('Existing sequence record updated successfully.');
//         }

//         const finalPO = `client_PO-${yearMonth}-${channelCode.toUpperCase()}-${nextValue}`;
//         console.log(`--- END: Generated PO Number successfully: ${finalPO} ---`);
//         return finalPO;

//     } catch (error:any) {
//         console.error('--- ERROR in generateClientPurchaseOrderNumber ---');
//         console.error('Message:', error.message);
//         console.error('Stack Trace:', error.stack);
//         // Rethrow the error so the outer database transaction knows to ROLLBACK
//         throw error; 
//     }
// }

    



// }

// export default ClientPurchaseOrderService;
