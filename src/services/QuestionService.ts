// src/services/QuestionService.ts
// Use ES Module imports consistently
import { AppDataSource } from '../../data-source';
import { Repository,EntityManager, Equal, In } from 'typeorm'; // Import Repository directly for init method
import { Question } from '../entity/Question'; // Import Question entity and its enums
import { QuestionTypeLookup } from '../entity/QuestionTypeLookup';
import { QuestionCategoryLookup } from '../entity/QuestionCategoryLookup';
import { QuestionPurposeLookup } from '../entity/QuestionPurposeLookup';
import { CreateBaseQuestionDto, CreateQuestionDto, UpdateQuestionDto } from '../Models/Question.interfaces';
import { Option } from '../entity/Option';
import { Subject } from '../entity/Subject';
import { Topic } from '../entity/Topic';
//import {CreateQuestionDto, UpdateQuestionDto}from '../Models/Question'



//import { BackendUpdateQuestionDto } from '../dto/tenant.dto';
// Or: import { generateUUID } from '../Special/helpers'; // If you put it here


class QuestionService {
    private questionRepository!: Repository<Question>; // Will be set by init method
    private optionRepository!:Repository<Option>;
    private questionTypeLookupRepository!: Repository<QuestionTypeLookup>;
    private questionCategoryLookupRepository!: Repository<QuestionCategoryLookup>;
    private questionPurposeLookupRepository!:Repository<QuestionPurposeLookup>;
private subjectRepository!:Repository<Subject>;
private topicRepository!:Repository<Topic>;
    constructor() {
      
     
    }

    /**
     * Initializes the QuestionService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Question.
     */
    async init(questionRepo: Repository<Question>,
        
        queationTypeLookupRepo: Repository<QuestionTypeLookup>,
        queationCategoryLookupRepo: Repository<QuestionCategoryLookup>,
        queationPurposesLookupRepo: Repository<QuestionPurposeLookup>,
        subjectRepo:Repository<Subject>,
        topicRepo:Repository<Topic>
        ): Promise<void> {
        this.questionRepository = questionRepo;
        this.questionTypeLookupRepository=queationTypeLookupRepo;
        this.questionCategoryLookupRepository=queationCategoryLookupRepo;

        this.questionPurposeLookupRepository=queationPurposesLookupRepo;
        this.subjectRepository=subjectRepo;
        this.topicRepository=topicRepo;
        console.log("QuestionService repositories initialized.");
    }

   
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param questionDto The DTO containing the data for the new question.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created Question.
     */
    async createQuestion(questionDto: CreateBaseQuestionDto, manager?: EntityManager): Promise<Question> {
        // This is a concise and correct way to get the right repository.
        const repo = manager ? manager.getRepository(Question) : this.questionRepository;

        // --- THIS IS THE KEY LINE TO AVOID MANUAL ASSIGNMENT ---
        // TypeORM's `create` method takes a plain object (our DTO) and returns a new
        // entity instance with all the properties correctly mapped.
        const newQuestion = repo.create(questionDto);
                
        return repo.save(newQuestion);
    }


    /**
     * Updates an existing Question with the given data.
     * @param id The ID of the question to update.
     * @param questionDto The DTO containing the data for the question update.
     * @returns A Promise of the updated Question entity.
     */
    async updateQuestion_preserve(id: number, questionDto: UpdateQuestionDto): Promise<Question> {
        const question = await this.questionRepository.findOneBy({ id });
                
        if (!question) {
            throw new Error('Question not found');
        }

        // Object.assign is a great way to merge the DTO properties into the entity.
        // It avoids manual, property-by-property assignment.
        Object.assign(question, questionDto);

        return this.questionRepository.save(question);
    }

  async updateQuestion(id: number, questionDto: UpdateQuestionDto): Promise<Question> {
    return AppDataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {
      const question = await transactionalEntityManager.findOneBy(Question, { id });
      if (!question) {
        throw new Error('Question not found');
      }

      // Step 1: Update the top-level Question entity fields
      Object.assign(question, questionDto);

      // Step 2: Delete all existing options for this question
      await transactionalEntityManager.delete(Option, { questionId: id });

      // Step 3: Create and save the new options
      if (questionDto.options && questionDto.options.length > 0) {
        // Map the DTO options to new Option entities, linking them to the question
        const newOptions = questionDto.options.map((optionDto:any )=> {
          const option = new Option();
          option.questionId = question.id; // Link the option to the question
          Object.assign(option, optionDto);
          return option;
        });

        // Save the new options
        await transactionalEntityManager.save(Option, newOptions);
      }

      // Step 4: Save the updated Question entity itself
      const updatedQuestion = await transactionalEntityManager.save(Question, question);

      return updatedQuestion;
    });
  }

  async mergeQuestionToTenant(sourceQuestionId: number, targetTenantId: string): Promise<Question> {
        return AppDataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {
            // Step 1: Find the original question and its global topic/subject
            const sourceQuestion = await transactionalEntityManager.findOne(Question, {
                where: { id: sourceQuestionId },
                relations: ['topic', 'topic.subject', 'options'], // Ensure options are also loaded
            });

            // Input validation and security check
            if (!sourceQuestion || sourceQuestion.tenantId !== 'hygienicflow') {
                throw new Error('Source question not found or is not from the global bank.');
            }
            const sourceTopic = sourceQuestion.topic; 
            console.log('.......here is sourceQuestion.topic:',sourceQuestion);
            const sourceSubject = sourceTopic!.subject;          
//console.log('........here is sourceTopic!.subject: ',sourceTopic);

            // Step 2: Find or create the tenant-specific subject
            let tenantSubject = await transactionalEntityManager.findOne(Subject, {
                where: { subjectName: sourceSubject.subjectName, tenantId: targetTenantId },
            });
            if (!tenantSubject) {
                tenantSubject = this.subjectRepository.create({
                    subjectName: sourceSubject.subjectName,
                    subjectCode: sourceSubject.subjectCode,
                    tenantId: targetTenantId,
                });
                await transactionalEntityManager.save(tenantSubject);
            }
//console.log('.....searching topic for name:',sourceTopic!.topicName,' and tid:',targetTenantId, ' where tenantSubject.id is:',tenantSubject.id);

            // Step 3: Find or create the tenant-specific topic
            let tenantTopic = await transactionalEntityManager.findOne(Topic, {
                where: { topicName: sourceTopic!.topicName, tenantId: targetTenantId, subjectId: tenantSubject.id },
            });
            if (!tenantTopic) {
              //  console.log('........not found topic');
                
                tenantTopic = this.topicRepository.create({
                    topicName: sourceTopic!.topicName,
                    subjectId: tenantSubject.id,
                    tenantId: targetTenantId,
                });
                await transactionalEntityManager.save(tenantTopic);
            }

            // // Step 4: Create the new question record for the tenant
            // const newQuestion = this.questionRepository.create({
            //     ...sourceQuestion, // Copy top-level properties
            //     id: undefined, // Clear the primary key to create a new record
            //     topicId: tenantTopic.id, // Link to the new tenant-scoped topic
            //     tenantId: targetTenantId, // Assign the new tenant ID
            //     options: undefined // Temporarily clear relations to handle them separately
            // });
            
            // Step 4: Create the new question record for the tenant
            // IMPORTANT: MANUALLY copy properties instead of using a spread to avoid copying the original ID
            const newQuestion = this.questionRepository.create({
                questionText: sourceQuestion.questionText,
                questionTypeName: sourceQuestion.questionTypeName,
                questionCategoryName: sourceQuestion.questionCategoryName,
                questionPurposeName: sourceQuestion.questionPurposeName,
            //    -- add other properties you need to copy here --
                topicId: tenantTopic.id, // Link to the new tenant-scoped topic
                tenantId: targetTenantId, // Assign the new tenant ID
                sourceQuestionId:sourceQuestion.id,
            });

            const savedQuestion = await transactionalEntityManager.save(newQuestion);
            
            // Step 5: Copy and save the options for the new question
            if (sourceQuestion.options && sourceQuestion.options.length > 0) {
                const newOptions = sourceQuestion.options.map((option: any) => {
                    const newOption = new Option(); // Create new option entity
                   
                   // IMPORTANT: Manually copy properties from the source option.
                    // DO NOT use Object.assign to avoid copying the original ID.
                    newOption.optionText = option.optionText;
                    newOption.isCorrect = option.IsCorrect;


                  //  newOption.id = 0; // Clear PK
                    newOption.questionId = savedQuestion.id; // Link to the newly saved question
                    return newOption;
                });
                await transactionalEntityManager.save(Option, newOptions);
                savedQuestion.options = newOptions; // Attach new options to the returned question
            }

            return savedQuestion;
        });
    }
    /**
     * Retrieves all Question records from the database.
     * @returns An array of Question entities.
     */
    getQuestions = async (ptenantId:string,
        manager?: EntityManager): Promise<Question[]> => {
                       
                       
        if (!this.questionRepository) {
            throw new Error("QuestionService repository not initialized. Call init() first.");
        }
        const questionRepository = manager ? manager.getRepository(Question) : this.questionRepository;
        return await questionRepository.find({where:[{tenantId:ptenantId},{ tenantId: 'hygienicflow' }],relations:['topic']}); // Use find() to get all
    }

    
    async getById(id: number
        ,manager?: EntityManager): Promise<Question | undefined> {
                     
        if (!this.questionRepository) {
            throw new Error("QuestionService repository not initialized. Call init() first.");
        }
        const questionRepository = manager ? manager.getRepository(Question) : this.questionRepository;
        
        var aquestion = await questionRepository.findOne({
            where: { id: id }
            
           
        });

        if (aquestion) {
            return aquestion;
        }
        return undefined;
    }

    getQuestionTypes = async (): Promise<QuestionTypeLookup[]> => { // Or Observable<EnumOption[]> if backend sends label/value
        if (!this.questionTypeLookupRepository) {
            throw new Error("questionTypeLookupRepository repository not initialized. Call init() first.");
        }
        return await this.questionTypeLookupRepository.find();

    }
    getQuestionCategories= async (): Promise<QuestionCategoryLookup[]> => { // Or Observable<EnumOption[]> if backend sends label/value
        if (!this.questionCategoryLookupRepository) {
            throw new Error("questionCategoryLookupRepository repository not initialized. Call init() first.");
        }
        return await this.questionCategoryLookupRepository.find();

    }
    getQuestionPurposes = async (): Promise<QuestionPurposeLookup[]> => { // Or Observable<EnumOption[]> if backend sends label/value
        if (!this.questionPurposeLookupRepository) {
            throw new Error("questionPurposeLookupRepository repository not initialized. Call init() first.");
        }
        return await this.questionPurposeLookupRepository.find();

    }
   async findByIds(questionIds:string[], manager?: EntityManager): Promise<Question[]> {
        const questionRepository = manager ? manager.getRepository(Question) : this.questionRepository;
        return await questionRepository.findBy({id:In(questionIds)})

    }

}



export default QuestionService;