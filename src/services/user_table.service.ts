//User_tableService
import { Repository } from 'typeorm'; // Import Repository directly
import { User_table_fields } from '../entity/user_table_fields'; // Import your User_table entity


import { User } from '../Models/User';
import { getUser_tableServiceRepository } from '../dependencies';



//const userRepository = new UserRepository(); // Instantiate your repository
// Define an interface for your cached application settings

 class User_tableService{

  
  private isInitialized = false;
  private currentUsertableFields:Partial<User_table_fields>[] = [
    { FieldName: 'userName', FieldType: 'input', FieldLabel: 'User name',    IsRequired: true,  CreatedByMode: 'superadmin'      },

    { FieldName: 'displayName', FieldType: 'input', FieldLabel: 'Display Name',    IsRequired: true,    CreatedByMode: 'superadmin'      },
    { FieldName: 'displayName', FieldType: 'input', FieldLabel: 'Display Name',    IsRequired: true,   CreatedByMode: 'signup'      }, 

    { FieldName: 'initialRoleName', FieldType: 'select', FieldLabel: 'Role',    IsRequired: true, SelectOptions: '[{"label":"DataEntry","value":"DataEntry"},{"label":"purchaserole","value":"purchaser"}]',  CreatedByMode: 'superadmin'      },
    { FieldName: 'initialRoleName', FieldType: 'select', FieldLabel: 'Role',    IsRequired: true, SelectOptions: '[{"label":"DataEntry","value":"DataEntry"},{"label":"purchaserole","value":"purchaser"}]',  CreatedByMode: 'signup'      },
    

    

    { FieldName: 'email',    FieldType: 'input', FieldLabel: 'Email Address',IsRequired: true,   CreatedByMode: 'signup'          },
    { FieldName: 'password', FieldType: 'input', FieldLabel: 'Password',     IsRequired: true,   CreatedByMode: 'signup'          },
    { FieldName: 'password', FieldType: 'input', FieldLabel: 'Password',     IsRequired: true,   CreatedByMode: 'superadmin'      },
    
  ];
  private User_table_Repository!: Repository<User_table_fields>;
  
  
   /**
     * Initializes the User_tableService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for User_table.
     */
      async init(repo: Repository<User_table_fields>): Promise<void> {
        this.User_table_Repository = repo;
       
      }
    

   

    
    /**
     * Ensures that a default settings record exists in the database.
     * If it doesn't exist, it creates one with predefined default values.
     * It then loads these settings into memory (this.currentUsertable).
     */
    async ensureDefaultUserTableFields(config_usersCreatedby:any): Promise<void> {
      // Ensure repository is available before using it
      if (!this.User_table_Repository) {
          throw new Error("UsertableService has not been initialized. Call init() first.");
      }

    
      try { 
          // 1. Try to find the existing settings record by its primary key
          let dbUsertableFields = await this.User_table_Repository.find({where:{CreatedByMode:config_usersCreatedby}});

          if (!dbUsertableFields.length) {  
              // // 2. If no usertablefield record found, create one with default values
              // console.log('No global usertablefield found in DB. Creating default usertablefield record...');
              let dbUsertablefielddetails=null;
              this.currentUsertableFields.map(ausertblFld=>{
            
               
               dbUsertablefielddetails = new User_table_fields() // Create an instance of the Usertable entity
               dbUsertablefielddetails.FieldName = ausertblFld.FieldName?ausertblFld.FieldName:'';
               dbUsertablefielddetails.FieldType = ausertblFld.FieldType?ausertblFld.FieldType:'';
               dbUsertablefielddetails.FieldLabel = ausertblFld.FieldLabel?ausertblFld.FieldLabel:'';
               dbUsertablefielddetails.IsRequired = ausertblFld.IsRequired?ausertblFld.IsRequired:true;
               dbUsertablefielddetails.CreatedByMode = ausertblFld.CreatedByMode?ausertblFld.CreatedByMode:'superadmin';
              // //Save the new default usertablefield to the database
              this.User_table_Repository.save(dbUsertablefielddetails);
               }
                 
                )
               console.log('Default settings record created in DB.');
          } else {
              console.log('Global settings found in database.');
          }

          // 3. Update the in-memory cache with values from the database
          this.currentUsertableFields = dbUsertableFields;

          this.isInitialized = true;
        
      } catch (error) {
          console.error('Error ensuring/loading default settings:', error);
          throw error; // Re-throw to indicate a critical initialization failure
      }
  }

   //This is for building for by reading which field exists in user table
    // get usert table fields
    get_user_table_fields = async (config_usersCreatedby:string|undefined): Promise<any> => { // Or Observable<EnumOption[]> if backend sends label/value
    

    await this.ensureDefaultUserTableFields(config_usersCreatedby);
    if (!this.isInitialized) {
      console.warn('User_tableService not fully initialized. Returning initial default settings. Ensure ensureDefaultUserTableFields() was called.');
  }
  return this.currentUsertableFields;

  }

 

}


 export default User_tableService