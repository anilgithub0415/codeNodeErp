

import { EntityManager, Not, Repository } from 'typeorm';
import { UserPreferences } from '../entity/user_preferences';



import { AppDataSource } from '../../data-source'; 

interface CreateUser_PreferenceDto{
    tenantId:number;
        
    [key:string]:any;
}

export interface CreatedUser_PreferenceResponse {
    user_Preference: UserPreferences;
  
}

export class User_PreferenceService{
 private user_PreferenceRepository!: Repository<UserPreferences>;
     /**
         * Initializes the User_PreferenceService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param user_PreferenceRepo The TypeORM Repository instance for User_Preference.
         * @param tenantRepo The TypeORM Repository instance for Tenant (if User_PreferenceService needs it).
         */
        async init(user_PreferenceRepo: Repository<UserPreferences>): Promise<void> {
            this.user_PreferenceRepository = user_PreferenceRepo;
                console.log("User_PreferenceService repository initialized.");       
        }


//         async getUser_Preference(
//             ptenantId:number,   pUserId:number,        
//             manager?: EntityManager
//         ): Promise<UserPreferences> {
// console.log('hitting url user_Preference for userid:.........................',pUserId);
//              if (!this.user_PreferenceRepository) {
//                         throw new Error("User_PreferenceService repository not initialized. Call init() first.");
//                     }

                   
                    
//                     const user_PreferenceRepository = manager ? manager.getRepository(UserPreferences) : this.user_PreferenceRepository;
//                     const ps= await user_PreferenceRepository.findOne({where:{tenantId:ptenantId , userId:pUserId}}); // Use find() to get all 
//                  console.log('..................return user prefrence:',ps);
                 
                    
//                     return ps!; 
//                 }

/*Note: If no user prefrences found then default emrald preset is returned to UI*/
async getUser_Preference(
    ptenantId: number, pUserId: number,        
    manager?: EntityManager
): Promise<UserPreferences | any> {
    
    if (!this.user_PreferenceRepository) {
        throw new Error("User_PreferenceService repository not initialized. Call init() first.");
    }

    const user_PreferenceRepository = manager ? manager.getRepository(UserPreferences) : this.user_PreferenceRepository;
    const ps = await user_PreferenceRepository.findOne({ where: { tenantId: ptenantId, userId: pUserId } }); 
   
    
    // ─── FIX: IF NO RECORD EXISTS, RETURN A DEFAULT OBJECT ───
    if (!ps) { console.log('No user prefrences found');
    
        return {
            tenantId: ptenantId,
            userId: pUserId,
            preset: 'Aura',
            primary: 'emerald',
            surface: 'slate', // Matches AppConfigurator's default light surface
            darkTheme: false,
            menuMode: 'static'
        };
    }
    
    return ps; 
}

        async getUser_Preferences(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<UserPreferences[]> {

             if (!this.user_PreferenceRepository) {
                        throw new Error("User_PreferenceService repository not initialized. Call init() first.");
                    }

                   
                    
                    const user_PreferenceRepository = manager ? manager.getRepository(UserPreferences) : this.user_PreferenceRepository;
                    const ps= await user_PreferenceRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all 
                    
                    
                    return ps;
                }


    /**
     * Creates a new global User_Preference, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the user_Preference and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created User_Preference entity along with its initial context.
     */
    async createUser_Preference(
    createDto: CreateUser_PreferenceDto,
    manager?: EntityManager
): Promise<CreatedUser_PreferenceResponse> {
    const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
    let shouldReleaseQueryRunner = false;

    try {
        if (!manager) {
            await queryRunner!.connect();
            await queryRunner!.startTransaction();
            shouldReleaseQueryRunner = true;
        }

        const user_PreferenceRepo = queryRunner!.manager.getRepository(UserPreferences);

        // FIX: Enforce explicit parameter casting rules for type stability 
        const targetUserId = Number(createDto.userId);
        const targetTenantId = Number(createDto.tenantId);

        // Find existing record safely matching your database layout mapping configurations
        let aUser_Preference = await user_PreferenceRepo.findOne({ 
            where: { 
                userId: targetUserId, 
                tenantId: targetTenantId 
            } 
        });
       
        let newORexistinguser_Preference: UserPreferences;

        if (aUser_Preference) {
           
          
            // Selective merging to ensure safe updates
            Object.assign(aUser_Preference, {
                preset: createDto.preset ?? aUser_Preference.preset,
                primary: createDto.primary ?? aUser_Preference.primary,
                surface: createDto.surface === undefined ? aUser_Preference.surface : createDto.surface,
                darkTheme: createDto.darkTheme ?? aUser_Preference.darkTheme,
                menuMode: createDto.menuMode ?? aUser_Preference.menuMode,
                updatedAt: new Date() // Force fresh tracking hook instantiation
            });

            console.log('Executing database update mapping for preference record:', aUser_Preference);
            newORexistinguser_Preference = await user_PreferenceRepo.save(aUser_Preference); 
        } else {
            console.log(`No record detected. Initiating new preference row entry for userId: ${targetUserId}`);
            
            // Build out completely clean instance referencing exact structural property assignments
            const newUser_Preference = user_PreferenceRepo.create({
                userId: targetUserId,
                tenantId: targetTenantId,
                preset: createDto.preset,
                primary: createDto.primary,
                surface: createDto.surface,
                darkTheme: createDto.darkTheme,
                menuMode: createDto.menuMode
            });
       
            newORexistinguser_Preference = await user_PreferenceRepo.save(newUser_Preference);  
        }

        if (shouldReleaseQueryRunner) {
            await queryRunner!.commitTransaction();
        }

        return { user_Preference: newORexistinguser_Preference };

    } catch (error) {
        if (shouldReleaseQueryRunner) {
            await queryRunner!.rollbackTransaction();
        }
        console.error('Fatal execution exception within createUser_Preference block:', error);
        throw error;
    } finally {
        if (shouldReleaseQueryRunner) {
            await queryRunner!.release();
        }
    }
}


async deleteUser_Preference(
    ptenantId: number,   
    pUserId: number,        
    manager?: EntityManager
): Promise<void> {
    console.log('Deleting user_Preference for userid:.........................', pUserId);
    
    if (!this.user_PreferenceRepository) {
        throw new Error("User_PreferenceService repository not initialized. Call init() first.");
    }

    const user_PreferenceRepository = manager 
        ? manager.getRepository(UserPreferences) 
        : this.user_PreferenceRepository;

    // Direct deletion using the composite criteria
    await user_PreferenceRepository.delete({ 
        tenantId: ptenantId, 
        userId: pUserId 
    });
}


    }
           
export default User_PreferenceService