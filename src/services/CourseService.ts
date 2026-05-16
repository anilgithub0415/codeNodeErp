// src/services/CourseService.ts
// Use ES Module imports consistently
import { Repository,EntityManager, And } from 'typeorm'; // Import Repository directly for init method
import { Course,  } from '../entity/Course'; // Import Course entity and its enums
import { CreateCourseDto, UpdateCourseDto } from '../Models/Course.interfaces';
import { ProgramCourses } from '../entity/ProgramCourses';

class CourseService {
    private courseRepository!: Repository<Course>; // Will be set by init method
    private programcoursesRepository!:Repository<ProgramCourses>
    
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    /**
     * Initializes the CourseService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Course.
     */
    async init(courseRepo: Repository<Course>,programcoursesRepo:Repository<ProgramCourses>): Promise<void> {
        this.courseRepository = courseRepo;
        this.programcoursesRepository=programcoursesRepo
        console.log("CourseService repositories initialized.");
    }

   
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param courseDto The DTO containing the data for the new course.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created Course.
     */
    async createCourse(courseDto: CreateCourseDto, manager?: EntityManager): Promise<Course> {
        // This is a concise and correct way to get the right repository.
        const repo = manager ? manager.getRepository(Course) : this.courseRepository;

        // --- THIS IS THE KEY LINE TO AVOID MANUAL ASSIGNMENT ---
        // TypeORM's `create` method takes a plain object (our DTO) and returns a new
        // entity instance with all the properties correctly mapped.
        const newCourse = repo.create(courseDto);
        
        return repo.save(newCourse);
    }

    /**
     * Updates an existing Course with the given data.
     * @param id The ID of the course to update.
     * @param courseDto The DTO containing the data for the course update.
     * @returns A Promise of the updated Course entity.
     */
    async updateCourse(id: number, courseDto: UpdateCourseDto): Promise<Course> {
        const course = await this.courseRepository.findOneBy({ id });
        
        if (!course) {
            throw new Error('Course not found');
        }

        // Object.assign is a great way to merge the DTO properties into the entity.
        // It avoids manual, property-by-property assignment.
        Object.assign(course, courseDto);

        return this.courseRepository.save(course);
    }

    /**
     * Deletes a Course by its ID.
     * @param id The ID of the course to delete.
     * @returns A Promise that resolves once the course is deleted.
     */
    async deleteCourse(id: number): Promise<void> {
        const course = await this.courseRepository.findOneBy({ id });
        
        if (!course) {
            throw new Error('Course not found');
        }
        
        await this.courseRepository.remove(course);
    }
    /**
     * Retrieves all Course records from the database.
     * @returns An array of Course entities.
     */
    getCourses = async (ptenantId:string,
        manager?: EntityManager): Promise<Course[]> => {
       
            
        if (!this.courseRepository) {
            throw new Error("CourseService repository not initialized. Call init() first.");
        }
        const courseRepository = manager ? manager.getRepository(Course) : this.courseRepository;
        console.log('returning courses od tenantid:',ptenantId);
        
        return await courseRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all
    }

    /**
     * Retrieves all Course records from the database.
     * @returns An array of Course entities.
     */
    getCoursesByProgramId = async (pid:number,ptenantId:string,
        manager?: EntityManager): Promise<ProgramCourses[]> => {
       
            console.log('yes, by programId...........');
            
            
        if (!this.courseRepository) {
            throw new Error("CourseService repository not initialized. Call init() first.");
        }
        const programcoursesRepository = manager ? manager.getRepository(ProgramCourses) : this.programcoursesRepository;
        console.log('returning courses od tenantid:',ptenantId);
        
        return await programcoursesRepository.find({where:{tenantId:ptenantId ,programId:pid},relations:['course']}); //pending- we need one more where condition here tenantId:ptenantId 
        
    }
    
    async getById(id: number
        ,manager?: EntityManager): Promise<Course | undefined> {
            
        if (!this.courseRepository) {
            throw new Error("CourseService repository not initialized. Call init() first.");
        }
        const courseRepository = manager ? manager.getRepository(Course) : this.courseRepository;
        
        var acourse = await courseRepository.findOne({
            where: { id: id }
            
           
        });

        if (acourse) {
            return acourse;
        }
        return undefined;
    }

    
    

}



export default CourseService;