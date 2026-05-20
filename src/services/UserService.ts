
//pending- if Student preparing student profile while registering

// src/services/UserService.ts
import { EntityManager, Not, Repository } from 'typeorm';
import { User } from '../entity/User';

import { UserRoleLookup } from '../entity/UserRoleLookup';
import { UpdateUserDTO } from '../dto/CreateUser.dto';
//import { getTenantServiceRepository, getUserRepository } from '../dependencies'; // <-- User Service gets its dependencies from here!
import {getUser_tableServiceRepository} from '../dependencies';

import { AppDataSource } from '../../data-source'; // Assuming you have a data-source for repositories
import * as bcrypt from 'bcrypt'; // For password hashing

//import { StudentProfile } from '../entity/StudentProfile';
import { AutocodeService } from './autocode.service';
import { UserTenantContext } from '../entity/UserTenantContext';
import { User_table_fields } from '../entity/user_table_fields';

// Define DTOs for input and output (adjust based on your actual needs)
export interface CreateUserAndContextDto {
    // firstName: string;
    // lastName?: string;
    // contactEmail: string; // This will be the Person's contactEmail and the User's userName
    // contactPhone?: string;
    // password: string;
    // initialTenantId: string; // The tenant this user is being created for
    // initialRoleName: string; // The initial role for this user in this tenant
    // // Add other person/user fields as needed
    // firstName: string;  
    // lastName?: string;  
    // contactEmail: string;  
    // contactPhone?:string;
    initialTenantId: string;  
    initialRoleName: string;//earlier UserRoleLookup;  
    deviceInfo : string;
    userName: string;
    password: string;
    displayName?: string;
    //role: UserRoleLookup;//userRole;//changed
  //  tenantId: string; // Tenant ID is crucial for user creation now
    googleId?: string;
    createdByUserId?:number;

    //for faculty user
    faculty_department?:string;
    faculty_designation?:string;
}

// You might want to return the created User and its initial context info
export interface CreatedUserResponse {
    user: User;
    initialContext: UserTenantContext;
    
    password?: string;
  
}

// You will likely need a DTO for user creation if you don't use the full entity
interface CreateUserInternalDTO {
    userName: string;  
    password?: string;
    displayName?: string;
    role?: UserRoleLookup;//userRole;
    tenantId: string;
    googleId?: string;
    CreatedByUserId?:number;
    personId?:number;
}

// // And your UserUpdateDTO (as discussed previously)
// type UserUpdateDTO = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'refreshTokens' | 'tenant'>> & {
//     role:string;
//     password?: string;
// };

// Extend the User interface/type for frontend consumption
interface UserWithRole extends User {
    roleNameInContext?: string; // Add a new property to hold the role name
    faculty_department?: string|null; // Add this
    faculty_designation?: string|null; // Add this
  }

  
export class UserService {
    private autocodeService!: AutocodeService;
    private userRepository!: Repository<User>;
   
    private usertableRepository!:Repository<User_table_fields>;

    // You might also need the TenantRepository here if UserService directly links tenants on user creation
    private userRoleLookupRepository!: Repository<UserRoleLookup>;
    private userTenantContextRepository!:Repository<UserTenantContext>;
  
   

    constructor() {
        // Constructor is lean, repositories will be set via init

        this.autocodeService = new AutocodeService();
    }

    /**
     * Initializes the UserService with its TypeORM repository instances.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param userRepo The TypeORM Repository instance for User.
     * @param tenantRepo The TypeORM Repository instance for Tenant (if UserService needs it).
     */
    async init(userRepo: Repository<User>,  userRoleLookupRepo:Repository<UserRoleLookup>, usertableRepo:Repository<User_table_fields>): Promise<void> {
        this.userRepository = userRepo;      
        this.userRoleLookupRepository = userRoleLookupRepo;
        this.usertableRepository = usertableRepo;      
        
    }

    
    // Authenticate = async (userName: string, password: string): Promise<User | undefined> => {
    //     console.log('Authenticating............................................',userName,password);
        
    //     try {
    //         // Find user by userName
    //         const user = await this.userRepository.findOne({
    //             where: { userName: userName }
    //         });

    //         if (user) { 
            
    //             // Compare the provided password with the stored *hashed* password
    //             const passwordMatch =  await bcrypt.compare(password, user.password??'');

    //             if (passwordMatch) {
    //                const updUser={ ...user, password:''};
    //                return updUser;
    //             }
    //         }
    //         return undefined; // User not found or password didn't match
    //     } catch (error: any) {
    //         console.error('Error authenticating user:', error);
    //         throw error;
    //     }
    // };

    
    async Authenticate(userName: string, passwordPlain: string, manager?: EntityManager): Promise<User | null> {
        const userRepo = manager ? manager.getRepository(User) : this.userRepository;

        const user = await userRepo.findOne({
            where: { userName: userName },
          //  relations: ['person'] // Load person data if needed for display/initial setup
        });

        if (!user || !user.password) {
            return null; // User not found or no password set
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(passwordPlain, user.password);

        if (!!isPasswordValid) { // for a while we allowed invalid password
            return null; // Invalid password
        }

        return user; // Authentication successful
    }
      /**
     * Hashes a plain text password.
     * @param plainPassword The password in plain text.
     * @returns The hashed password.
     */
      private async hashPassword(plainPassword: string): Promise<string> {
        // Generate a salt (recommended to use 10-12 rounds for good balance of security and performance)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        return hashedPassword;
    }

    /**
     * Compares a plain text password with a hashed password.
     * @param plainPassword The password in plain text.
     * @param hashedPassword The hashed password from the database.
     * @returns True if passwords match, false otherwise.
     */
    private async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }





    /**
     * Creates a new global User, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the user and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created User entity along with its initial context.
     */
    async createUserAndContext(
        createDto: CreateUserAndContextDto,
        manager?: EntityManager
    ): Promise<CreatedUserResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

          
            const userRepo = queryRunner!.manager.getRepository(User);
            const userRoleLookupRepo = queryRunner!.manager.getRepository(UserRoleLookup);
            const userTenantContextRepo = queryRunner!.manager.getRepository(UserTenantContext);
            

           

            

            // 3. Create or Find User (existing logic)
            let newORexistinguser: User;
            let aUser = await userRepo.findOne({ where: { userName: createDto.userName } });
            if (aUser) {
               // console.log(`found user with contactemail: ${createDto.contactEmail}`);
                newORexistinguser = aUser;
            } else {
                console.log(`creating user with data username: ${createDto}`);
                const hashedPassword = await bcrypt.hash(createDto.password!, 10);
                const newUser = userRepo.create({
                    userName: createDto.userName,
                   // displayName: `${person.firstName} ${person.lastName || ''}`.trim(),
                   displayName:createDto.displayName,
                    password: hashedPassword,
                    isActive: true,
                    isEmailVerified: false,
                   // personId: person.id,
                    createdByUserId: createDto.createdByUserId
                });
                newORexistinguser = newUser;
                await userRepo.save(newUser); 
            }

            // 4. Create Initial UserTenantContext (existing logic)
            const newUserContext = userTenantContextRepo.create({
                userId: newORexistinguser.id,
                tenantId: createDto.initialTenantId,
                roleName: createDto.initialRoleName,
                isActiveInContext: true,
            });
            console.log('here m inserting newusercontext:',newUserContext);
            
            await userTenantContextRepo.save(newUserContext);


           

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

          return { user: newORexistinguser, initialContext: newUserContext };
            

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createUserAndContext:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }
    //---------------------------------------------------------------------------------------------------------------------------------

    /**
     * Updates an existing user.
     * @param id The ID of the user to update.
     * @param updateData The partial data to update.
     * @returns The updated User entity, or undefined if not found.
     */
    async updateUser(id: number, updateData: UpdateUserDTO
        ,manager?: EntityManager): Promise<User | undefined> {//UserUpdateDTO

            console.log('updating........................user:',updateData);
            
        if (!this.userRepository) {
            throw new Error("UserService repository not initialized. Call init() first.");
        }
       
        const userToUpdate = await this.userRepository.findOne({ where: { id: id } });
        if (!userToUpdate) {
            return undefined;
        }
        const userRepository = manager ? manager.getRepository(User) : this.userRepository;
        // Handle password update separately
        if (updateData.password !== undefined) {
            // Check if the new password is provided and not empty
            if (updateData.password.trim() !== '') {
                userToUpdate.password = await this.hashPassword(updateData.password); // <--- HASH NEW PASSWORD HERE
            }
            delete updateData.password; // Remove from DTO to prevent Object.assign from overwriting
        }
        Object.assign(userToUpdate, updateData); // Apply other updates

console.log('m assigning role:',updateData.roleNameInContext,'  for id:',id,' and tenantid:',updateData.activeTenantId);

        //---usertenatcontext-updating----------------------------------------------------------------------------------
        const userContextToUpdate = await this.userTenantContextRepository.findOne({
            where: {
                userId: id,
                tenantId: updateData.activeTenantId
            }})
        if (!userContextToUpdate) {
            return undefined;
        }
        const userContestRepository = manager ? manager.getRepository(UserTenantContext) : this.userTenantContextRepository;
        // Handle password update separately
        if (updateData.roleNameInContext !== undefined) {
            // Check if the rolename is provided and not empty
            if (updateData.roleNameInContext.trim() !== '') {
                userContextToUpdate.roleName = updateData.roleNameInContext; // <--- HASH NEW PASSWORD HERE
            }
            // Remove from DTO to prevent Object.assign from overwriting
        }
        Object.assign(userContextToUpdate, updateData); // Apply other updates
        
        await userContestRepository.save(userContextToUpdate)
        //--------------------------------------------------------------------------------------



        return await userRepository.save(userToUpdate);
    }

    /**
     * Retrieves a user by ID.
     * @param id The ID of the user.
     * @returns The User entity, or undefined if not found.
     */
    // async getById(id: number): Promise<User | undefined> {
    //     if (!this.userRepository) {
    //         throw new Error("UserService repository not initialized. Call init() first.");
    //     }
    //     var auser= await this.userRepository.findOne({ where: { id: id } });
    //     if(auser){
    //          return auser;
    //     }
    //     return undefined
    // }


    async getById(id: number
        ,manager?: EntityManager): Promise<User | undefined> {
        if (!this.userRepository) {
            throw new Error("UserService repository not initialized. Call init() first.");
        }
        const userRepository = manager ? manager.getRepository(User) : this.userRepository;
        // MODIFIED: Use the 'relations' option to eager load the 'tenant' relationship
        var auser = await userRepository.findOne({
            where: { id: id }
            ,relations:['userTenantContexts'] //added for studentprofile
           // ,            relations: ['tenant'] // This tells TypeORM to join and load the related Tenant entity
        });

        if (auser) {
            // If the user is found and tenant relation is loaded,
            // 'auser.tenant' will now contain the Tenant object,
            // from which you can access auser.tenant.tenantType.
            return auser;
        }
        return undefined;
    }
    
    /**
     * Retrieves all users (for the current tenant context - assuming this will be filtered later).
     * @returns An array of User entities.
     */
    // //ptenantId:string,
    // async getUsers(paramcondition?:string
    //     ,manager?: EntityManager): Promise<User[]> {
    //     if (!this.userRepository) {
    //         throw new Error("UserService repository not initialized. Call init() first.");
    //     }

    //     const userRepository = manager ? manager.getRepository(User) : this.userRepository;

    //     if (paramcondition === 'onlystudents') {
        
    //         // Step 1: Await the role lookup to get the actual UserRoleLookup entity
    //         const studentRole = await this.userRoleLookupRepository.findOne({
    //             where: {
    //                 // Assuming 'rolefortenanttype' is a column in UserRoleLookup
    //                 // that indicates which tenant type this role is primarily for.
    //                 // If 'rolename' itself is unique and sufficient, you can simplify.
    //                 // Based on your entities, UserRoleLookup only has 'rolename'.
    //                 // So, you likely want to query by 'rolename' directly.
    //                 rolename: 'Student' // Use the actual rolename string
    //             }
    //         });


    //         if (!studentRole) {
    //             // Handle case where 'Student' role is not found in lookup table
    //             console.warn("Student role not found in UserRoleLookup table.");
    //             return []; // Or throw an error, depending on desired behavior
    //         }

    //         // Step 2: Use the resolved 'studentRole' entity object in the 'where' clause
    //         return await userRepository.find()
    //         // {
    //         //     where: {
    //         //         //tenantId: ptenantId,
    //         //         role: studentRole // Assign the actual UserRoleLookup entity object
    //         //     }
    //         // });
    //     }

    //     // Default case: retrieve all users for the given tenantId
    //     return await userRepository.find();//{ where: { tenantId: ptenantId } }
    // }
     /**
     * Retrieves User entities based on tenant ID and optionally filters by roles.
     * In this model, 'users' are global login accounts. Filtering by roles means
     * finding users who have a specific role within a specific tenant context.
     *
     * @param tenantId The ID of the tenant to filter users for. MANDATORY.
     * @param roles An optional array of role names (strings) to filter by.
     * @param manager Optional EntityManager for transactional operations.
     * @returns A promise that resolves to an array of User entities.
     */
    //Logic: extended User type by additional property: roleNameInContext
    //logic contra tag:roleNameInContext extra field
    
async getUsers(
    activeTenantId: string,
    roles?: string[],
    manager?: EntityManager
): Promise<UserWithRole[]> {
    const userTenantContextRepo = manager ? manager.getRepository(UserTenantContext) : this.userTenantContextRepository;

    const queryBuilder = userTenantContextRepo.createQueryBuilder('utc')
        .leftJoinAndSelect('utc.user', 'user')
        .leftJoinAndSelect('utc.role', 'role')
        // Correct join path: start from 'user' and go through 'person'
        //.leftJoinAndSelect('user.person', 'person') // First join to the Person entity
        .leftJoinAndSelect('person.facultyProfile', 'facultyProfile'); // Then join to the FacultyProfile entity

    queryBuilder
        .where('utc.isActiveInContext = :isActive', { isActive: true })
        .andWhere('utc.tenantId = :activeTenantId', { activeTenantId });

    if (roles && roles.length > 0) {
        queryBuilder.andWhere('utc.roleName IN (:...roles)', { roles: roles });
    } else {
        return [];
    }

    const userContexts = await queryBuilder.getMany();

    const uniqueUsersWithRoles: UserWithRole[] = [];
    const userIdsSeen = new Set<number>();

    for (const context of userContexts) {
        if (context.user && !userIdsSeen.has(context.user.id)) {
            // The path to the faculty profile is now context.user.person.facultyProfile
           // const facultyProfile = context.user.person?.facultyProfile;

            const userWithRole: UserWithRole = {
                ...context.user,
                roleNameInContext: context.role ? context.role.rolename : undefined,
                // Access the properties through the correct path
             //  faculty_department: facultyProfile ? facultyProfile.department : undefined,
             //  faculty_designation: facultyProfile ? facultyProfile.designation : undefined,
            };

            uniqueUsersWithRoles.push(userWithRole);
            userIdsSeen.add(context.user.id);
        }
    }

    return uniqueUsersWithRoles;
}
    
    
    /**
     * Retrieves a single User by their global ID.
     * @param userId The global ID of the User.
     * @param manager Optional EntityManager.
     * @returns A promise that resolves to the User entity or null if not found.
     */
    async getUserById(userId: number, manager?: EntityManager): Promise<User | null> {
        const userRepo = manager ? manager.getRepository(User) : this.userRepository;
     
        
        
        return await userRepo.findOne({
            where: { id: userId },
          // relations: ['person'] // Load the associated Person data if needed
        });
    }
    

    /**
     * Retrieves a single User by their userName and tenantId.
     * This is useful for login or tenant-specific user lookup.
     * @param userName The userName (email) of the user.
     * @param tenantId The tenant ID.
     * @param manager Optional EntityManager.
     * @returns A promise that resolves to the User entity or null if not found.
     */
    async getUserByUserNameAndTenant(
        userName: string,
        tenantId: string,
        manager?: EntityManager
    ): Promise<User | null> {
        const userRepo = manager ? manager.getRepository(User) : this.userRepository;
        
        // We need to find the User through UserTenantContext
        const userContext = await this.userTenantContextRepository.createQueryBuilder('utc')
            .leftJoinAndSelect('utc.user', 'user')
            .where('user.userName = :userName', { userName })
            .andWhere('utc.tenantId = :tenantId', { tenantId })
            .getOne();

        return userContext ? userContext.user : null;
    }

    // You might also need a method to get a user's roles for a specific tenant:
    async getUserRolesForTenant(userId: number, tenantId: string, manager?: EntityManager): Promise<UserRoleLookup[]> {
        const userTenantContextRepo = manager ? manager.getRepository(UserTenantContext) : this.userTenantContextRepository;
        
        const contexts = await userTenantContextRepo.find({
            where: { userId: userId, tenantId: tenantId, isActiveInContext: true },
            relations: ['role']
        });

        return contexts.map(context => context.role);
    }
    /**
     * Deletes a user by ID.
     * @param id The ID of the user to delete.
     */
    async deleteUser(id: number
        ,manager?: EntityManager): Promise<void> {
        if (!this.userRepository) {
            throw new Error("UserService repository not initialized. Call init() first.");
        }   
        
        const userRepository = manager ? manager.getRepository(User) : this.userRepository;
        await userRepository.delete(id);
    }
    getUserRoles = async (): Promise<UserRoleLookup[]> => { // Or Observable<EnumOption[]> if backend sends label/value
            
        if (!this.userRoleLookupRepository) {
            throw new Error("userRoleLookupRepository repository not initialized. Call init() first.");
        }
       // return await this.userRoleLookupRepository.find({where:{rolefortenanttype:'INSTITUTE',rolename:Not ('SuperAdmin') }});
       return await this.userRoleLookupRepository.find({where:{rolename:Not ('SuperAdmin') }});

    }



    //This is for building for by reading which field exists in user table
    // get usert table fields
    get_user_table_fields = async (config_usersCreatedby:string|undefined): Promise<any[]> => { // Or Observable<EnumOption[]> if backend sends label/value
        const usertableService = getUser_tableServiceRepository(); // Get the singleton instance
       // const usertable =await usertableService.getUser_table_fields(); 
        //    let usertable_fields_array = await usertable.find();
         let usertable_fields_array= await this.usertableRepository.find({where:{CreatedByMode:config_usersCreatedby}});
   
       return await usertable_fields_array

    }

}

export default UserService; // Export the CLASS