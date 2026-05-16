// sample paging approach for courseoffering data access 
// // Always filter by tenantId for multi-tenancy
// getCourseOfferings = async (tenantId: string, manager?: EntityManager): Promise<CourseOffering[]> => {
//     const courseOfferingRepository = manager ? manager.getRepository(CourseOffering) : this.courseOfferingRepository;
//     return await courseOfferingRepository.find({
//         where: { tenantId: tenantId }, // <--- CRUCIAL FOR SECURITY AND PERFORMANCE
//         relations: ['course', 'faculty.person'],
//         // Add pagination options here:
//         // skip: (page - 1) * limit, // Example for page-based pagination
//         // take: limit,
//         // order: { createdAt: 'DESC' } // Always good to have a consistent order for pagination
//     });
// }

// src/services/CourseOfferingService.ts
// Use ES Module imports consistently
import { Repository,EntityManager } from 'typeorm'; // Import Repository directly for init method
import { isAccessor } from 'typescript';
import { CourseOffering } from '../entity/CourseOffering'; // Import CourseOffering entity and its enums
import { CreateCourseOfferingDto, UpdateCourseOfferingDto } from '../Models/CourseOffering.interfaces';

import {Observable, from} from 'rxjs'
import { AppDataSource } from '../../data-source';
import { FacultyProfile } from '../entity/FacultyProfile';
class CourseOfferingService {
    private courseOfferingRepository!: Repository<CourseOffering>; // Will be set by init method
    
    constructor() {
        // Constructor is lean, repository will be injected or set via init
    }

    
    /**
     * The correct way to create an entity from a DTO without manual copying.
     * TypeORM's `create` method does the mapping for you.
     * @param courseOfferingDto The DTO containing the data for the new courseOffering.
     * @param manager An optional EntityManager for transactional support.
     * @returns A Promise of the newly created CourseOffering.
     */
    async createCourseOffering(courseOfferingDto: CreateCourseOfferingDto, manager?: EntityManager): Promise<CourseOffering> {
        // This is a concise and correct way to get the right repository.
        const repo = manager ? manager.getRepository(CourseOffering) : this.courseOfferingRepository;

        // --- THIS IS THE KEY LINE TO AVOID MANUAL ASSIGNMENT ---
        // TypeORM's `create` method takes a plain object (our DTO) and returns a new
        // entity instance with all the properties correctly mapped.
        const newCourseOffering = repo.create(courseOfferingDto);
        
        return repo.save(newCourseOffering);
    }

    /**
     * Initializes the CourseOfferingService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for CourseOffering.
     */
    async init(courseOfferingRepo: Repository<CourseOffering>): Promise<void> {
        this.courseOfferingRepository = courseOfferingRepo;
        console.log("CourseOfferingService repositories initialized.");
    }

   //
   
    /**
     * Updates an existing Subject with the given data.
     * @param id The ID of the subject to update.
     * @param subjectDto The DTO containing the data for the subject update.
     * @returns A Promise of the updated Subject entity.
     */
    async updateCourseOffering(id: number, courseOfferingDto: UpdateCourseOfferingDto): Promise<CourseOffering> {
        const courseOffering = await this.courseOfferingRepository.findOneBy({ id });
        
        if (!courseOffering) {
            throw new Error('courseOffering not found');
        }

        // Object.assign is a great way to merge the DTO properties into the entity.
        // It avoids manual, property-by-property assignment.
        Object.assign(courseOffering, courseOfferingDto);

        return this.courseOfferingRepository.save(courseOffering);
    }


    /**
     * Retrieves all CourseOffering records from the database.
     * @returns An array of CourseOffering entities.
     */
    getCourseOfferings = async (ptenantId:string,
        manager?: EntityManager): Promise<CourseOffering[]> => {
       
            
        if (!this.courseOfferingRepository) {
            throw new Error("CourseOfferingService repository not initialized. Call init() first.");
        }
        const courseOfferingRepository = manager ? manager.getRepository(CourseOffering) : this.courseOfferingRepository;
        console.log('returning courseofferings od tenantid:',ptenantId);
        return await courseOfferingRepository.find(
            {where:{tenantId:ptenantId},relations:['course','faculty.person']}
        );//({where:{tenantId:ptenantId}}); // Use find() to get all
    }
  
    getCourseOfferingsByFacultyIdThruPersonId = async (
        ppersonId: number,
        ptenantId: string,
        manager?: EntityManager
    ): Promise<CourseOffering[]> => {
        const facultyProfileRepository = manager
            ? manager.getRepository(FacultyProfile)
            : AppDataSource.getRepository(FacultyProfile);
        
        const courseOfferingRepository = manager
            ? manager.getRepository(CourseOffering)
            : AppDataSource.getRepository(CourseOffering);

        console.log('Finding faculty profile for personId:', ppersonId, 'and tenantId:', ptenantId);
        
        // Step 1: Find the FacultyProfile using personId and tenantId.
        const facultyProfile = await facultyProfileRepository.findOne({
            where: { 
                personId: ppersonId, 
                tenantId: ptenantId 
            }
        });

        if (!facultyProfile) {
            console.warn('No faculty profile found for personId:', ppersonId);
            return []; // Return an empty array if no faculty profile is found.
        }

        console.log('Found facultyProfileId:', facultyProfile.id, 'Now finding course offerings...');

        // Step 2: Use the found facultyId to get all CourseOfferings.
        return courseOfferingRepository.find({
            where: { 
                facultyProfileId: facultyProfile.id, 
                tenantId: ptenantId 
            }
        });
    };

    getCourseOfferingsByCourseId= async (pcourseid:number,ptenantId:string,
        manager?: EntityManager):  Promise<CourseOffering[]> => {//
       
            
            if (!this.courseOfferingRepository) {
                throw new Error("CourseOfferingService repository not initialized. Call init() first.");
            }
            const courseOfferingRepository = manager ? manager.getRepository(CourseOffering) : this.courseOfferingRepository;
            console.log('returning courseofferings od tenantid:',ptenantId);
        
            return   courseOfferingRepository.find(
                {where:{tenantId:ptenantId,courseId:pcourseid}}//,relations:['course','course.courseOfferings']
            );//({where:{tenantId:ptenantId}}); // Use find() to get all
            
        }
    

    async getById(id: number
        ,manager?: EntityManager): Promise<CourseOffering | undefined> {
            
        if (!this.courseOfferingRepository) {
            throw new Error("CourseOfferingService repository not initialized. Call init() first.");
        }
        const courseOfferingRepository = manager ? manager.getRepository(CourseOffering) : this.courseOfferingRepository;
        
        var acourseOffering = await courseOfferingRepository.findOne({
            where: { id: id }
            
           
        });

        if (acourseOffering) {
            return acourseOffering;
        }
        return undefined;
    }

    //
    
    /**
     * Deletes a Subject by its ID.
     * @param id The ID of the subject to delete.
     * @returns A Promise that resolves once the subject is deleted.
     */
    async deleteCourseOffering(id: number): Promise<void> {
        const courseoffering = await this.courseOfferingRepository.findOneBy({ id });
        
        if (!courseoffering) {
            throw new Error('Courseoffering not found');
        }
        
        await this.courseOfferingRepository.remove(courseoffering);
    }

}



export default CourseOfferingService;