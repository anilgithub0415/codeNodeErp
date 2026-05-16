import { AppDataSource } from '../../data-source';
import { Repository } from 'typeorm';
import { Question } from '../entity/Question';
import { Option } from '../entity/Option';
import { CreateQuestionWithDetailsDto, CreateOptionDto } from '../Models/Question.interfaces';
//import { QuestionService } from './QuestionService';

export class QuestionOrchestrationService {

    constructor(){}//private questionService: QuestionService) {}

    
    

    async createQuestionWithTransaction(questionDto: CreateQuestionWithDetailsDto ): Promise<Question> {
        return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
            console.log('--- Initiating transactional question creation ---');

            // 1. Prepare the Question data by removing the 'options' array.
            //    We use Omit<T, K> to create a temporary DTO without the options property.
            const { options, ...questionData } = questionDto;
            
            // 2. Create and save the Question entity
            const newQuestion = transactionalEntityManager.create(Question, {
                ...questionData,
                tenantId: questionDto.tenantId,
                // We're deliberately NOT assigning the `options` array to the `options` string column
                //options: null // Explicitly set the legacy column to null
            });
            
            const savedQuestion = await transactionalEntityManager.save(newQuestion);
            console.log(`> Question created with ID: ${savedQuestion.id}`);

            // 3. Create and save the related Option entities
            if (options && options.length > 0) {
                
                
                console.log(`> Creating ${options.length} options for the question.`);
                console.log('here options is:',options);
                // Create a list of Option entities to save
                const optionsToSave = options.map(optionDto => {
                    return transactionalEntityManager.create(Option, {
                        ...optionDto,
                        questionId: savedQuestion.id // Link each option to the new question ID
                    });
                });
                
                // Save all options in a single bulk operation
                await transactionalEntityManager.save(optionsToSave);
                console.log('> All options saved successfully.');
            }

            // 4. Return the complete question with its options loaded
            const finalQuestion = await transactionalEntityManager.findOne(Question, { 
                where: { id: savedQuestion.id },
                relations: ['options', 'questionType', 'questionCategory', 'questionPurpose', 'topic']
            });

            if (!finalQuestion) {
                 throw new Error("Failed to retrieve the final question after saving.");
            }

            console.log('--- Transactional question creation successful ---');
            return finalQuestion;
        });
    }

}