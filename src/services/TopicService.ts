// src/services/TopicService.ts
// Use ES Module imports consistently
import { Repository,EntityManager, And } from 'typeorm'; // Import Repository directly for init method
import { Topic,  } from '../entity/Topic'; // Import Topic entity and its enums
import { CreateTopicDto, UpdateTopicDto } from '../Models/Topic.interfaces';


class TopicService {
    private topicRepository!: Repository<Topic>; // Will be set by init method

    
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the TopicService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Topic.
     */
    async init(topicRepo: Repository<Topic>): Promise<void> {
        this.topicRepository = topicRepo;
     
        console.log("TopicService repositories initialized.");
    }

   
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param topicDto The DTO containing the data for the new topic.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created Topic.
     */
    async createTopic(topicDto: CreateTopicDto, manager?: EntityManager): Promise<Topic> {
        // This is a concise and correct way to get the right repository.
        const repo = manager ? manager.getRepository(Topic) : this.topicRepository;

        // --- THIS IS THE KEY LINE TO AVOID MANUAL ASSIGNMENT ---
        // TypeORM's `create` method takes a plain object (our DTO) and returns a new
        // entity instance with all the properties correctly mapped.
        const newTopic = repo.create(topicDto);
        
        return repo.save(newTopic);
    }

    /**
     * Updates an existing Topic with the given data.
     * @param id The ID of the topic to update.
     * @param topicDto The DTO containing the data for the topic update.
     * @returns A Promise of the updated Topic entity.
     */
    async updateTopic(id: number, topicDto: UpdateTopicDto): Promise<Topic> {
        const topic = await this.topicRepository.findOneBy({ id });
        
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Object.assign is a great way to merge the DTO properties into the entity.
        // It avoids manual, property-by-property assignment.
        Object.assign(topic, topicDto);

        return this.topicRepository.save(topic);
    }

    /**
     * Deletes a Topic by its ID.
     * @param id The ID of the topic to delete.
     * @returns A Promise that resolves once the topic is deleted.
     */
    async deleteTopic(id: number): Promise<void> {
        const topic = await this.topicRepository.findOneBy({ id });
        
        if (!topic) {
            throw new Error('Topic not found');
        }
        
        await this.topicRepository.remove(topic);
    }
    /**
     * Retrieves all Topic records from the database.
     * @returns An array of Topic entities.
     */
    getTopics = async (ptenantId:string,
        manager?: EntityManager): Promise<Topic[]> => {
       
            
        if (!this.topicRepository) {
            throw new Error("TopicService repository not initialized. Call init() first.");
        }
        const topicRepository = manager ? manager.getRepository(Topic) : this.topicRepository;
        console.log('returning topics od tenantid:',ptenantId);
        
        return await topicRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all
    }

    
    async getById(id: number
        ,manager?: EntityManager): Promise<Topic | undefined> {
            
        if (!this.topicRepository) {
            throw new Error("TopicService repository not initialized. Call init() first.");
        }
        const topicRepository = manager ? manager.getRepository(Topic) : this.topicRepository;
        
        var atopic = await topicRepository.findOne({
            where: { id: id }
            
           
        });

        if (atopic) {
            return atopic;
        }
        return undefined;
    }

    
    

}



export default TopicService;