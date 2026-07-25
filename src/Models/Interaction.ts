// src/Models/Interaction.ts
export interface CreateInteractionDto {
    customerId: number;
    userId: number;
    channel: 'Call' | 'WhatsApp' | 'Email' | 'In-Person Visit';
    direction: 'Inbound' | 'Outbound';
    purpose?: string;
    notes?: string;
    isSampleFeedback?: boolean;
    attachmentUrl?: string;
    nextFollowUpDate?: Date | null;
    nextFollowUpObjective?: string;
}

export interface UpdateInteractionDto {
    purpose?: string;
    notes?: string;
    isSampleFeedback?: boolean;
    attachmentUrl?: string;
    nextFollowUpDate?: Date | null;
    nextFollowUpObjective?: string;
}
