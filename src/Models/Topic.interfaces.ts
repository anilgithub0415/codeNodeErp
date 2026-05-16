
// We can import the same DTO interfaces from the frontend or define them here.
// Defining them here is a good practice for backend-specific validation, etc.
export interface CreateTopicDto {
    tenantId: string;
    topicName: string;
  
  }
  
/**
 * Data Transfer Object for updating an existing Topic.
 * All properties are optional, which allows for partial updates.
 * This is a common and flexible pattern for PUT or PATCH endpoints.
 */
export interface UpdateTopicDto {
    tenantId?: string;
    topicName: string;
}