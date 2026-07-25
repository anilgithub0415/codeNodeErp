// src/services/InteractionService.ts
import { Repository, EntityManager } from 'typeorm';
import { Interaction } from '../entity/Interaction';
import { CreateInteractionDto, UpdateInteractionDto } from '../Models/Interaction';

class InteractionService {
    private interactionRepository!: Repository<Interaction>;

    constructor() {}

    /**
     * Initializes the InteractionService with its TypeORM repository.
     */
    async init(interactionRepo: Repository<Interaction>): Promise<void> {
        this.interactionRepository = interactionRepo;
        console.log("InteractionService repository initialized.");
    }

    /**
     * Creates a logs entry for an interaction under a specific tenant.
     */
    createInteraction = async (
        tenantId: number, 
        dto: CreateInteractionDto, 
        manager?: EntityManager
    ): Promise<Interaction> => {
        if (!this.interactionRepository) {
            throw new Error("InteractionService not initialized.");
        }

        const repo = manager ? manager.getRepository(Interaction) : this.interactionRepository;

        const interaction = new Interaction();
        interaction.tenantId = tenantId;
        interaction.customerId = dto.customerId;
        interaction.userId = dto.userId;
        interaction.channel = dto.channel;
        interaction.direction = dto.direction;
        interaction.purpose = dto.purpose;
        interaction.notes = dto.notes;
        interaction.isSampleFeedback = dto.isSampleFeedback ?? false;
        interaction.attachmentUrl = dto.attachmentUrl;
        interaction.nextFollowUpDate = dto.nextFollowUpDate;
        interaction.nextFollowUpObjective = dto.nextFollowUpObjective;

        return await repo.save(interaction);
    }

    /**
     * Updates an interaction narrative or status.
     */
    updateInteraction = async (
        id: number, 
        tenantId: number, 
        dto: UpdateInteractionDto, 
        manager?: EntityManager
    ): Promise<Interaction | undefined> => {
        if (!this.interactionRepository) {
            throw new Error("InteractionService not initialized.");
        }

        const repo = manager ? manager.getRepository(Interaction) : this.interactionRepository;
        const interaction = await repo.findOne({ where: { interactionId: id, tenantId } });

        if (!interaction) return undefined;

        if (dto.purpose !== undefined) interaction.purpose = dto.purpose;
        if (dto.notes !== undefined) interaction.notes = dto.notes;
        if (dto.isSampleFeedback !== undefined) interaction.isSampleFeedback = dto.isSampleFeedback;
        if (dto.attachmentUrl !== undefined) interaction.attachmentUrl = dto.attachmentUrl;
        if (dto.nextFollowUpDate !== undefined) interaction.nextFollowUpDate = dto.nextFollowUpDate;
        if (dto.nextFollowUpObjective !== undefined) interaction.nextFollowUpObjective = dto.nextFollowUpObjective;

        return await repo.save(interaction);
    }

    /**
     * Fetches all timeline entries for a specific customer grid view.
     */
    getCustomerInteractions = async (
        tenantId: number, 
        customerId: number, 
        manager?: EntityManager
    ): Promise<Interaction[]> => {
        if (!this.interactionRepository) {
            throw new Error("InteractionService not initialized.");
        }

        const repo = manager ? manager.getRepository(Interaction) : this.interactionRepository;
        
        return await repo.find({
            where: { tenantId, customerId },
            relations: ['user'], // Join user entity to extract salesperson's name
            order: { createdAt: 'DESC' } // Ensure grid acts as timeline layout
        });
    }

    /**
     * Deletes an interaction log entry.
     */
    deleteInteraction = async (id: number, tenantId: number, manager?: EntityManager): Promise<void> => {
        if (!this.interactionRepository) {
            throw new Error("InteractionService not initialized.");
        }

        const repo = manager ? manager.getRepository(Interaction) : this.interactionRepository;
        await repo.delete({ interactionId: id, tenantId });
    }
}

export default InteractionService;
