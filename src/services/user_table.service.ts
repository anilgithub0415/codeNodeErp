//User_tableService
import { Repository } from 'typeorm'; // Import Repository directly
import { User_table_fields } from '../entity/user_table_fields'; // Import your User_table entity


import { User } from '../Models/User';



//const userRepository = new UserRepository(); // Instantiate your repository
// Define an interface for your cached application settings
export interface User_tableSettings {
  appname: string|undefined; 
  User_table_usersCreatedby: string|undefined; 
}
 class User_tableService{

  private User_table_fieldsRepository!: Repository<User_table_fields>;
   /**
     * Initializes the User_tableService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for User_table.
     */
      async init(repo: Repository<User_table_fields>): Promise<void> {
        this.User_table_fieldsRepository = repo;
        console.log("User_tableService repository initialized.");
      }
      private currentUser_table_fields: Partial<User_table_fields> = {
        FieldName: '',
        FieldType:'',

    };

   
getUser_table_fields=async():Promise<any>=>{

  try {
    // 1. Try to find the existing User_table record by its primary key
     let dbUser_table_fields = await this.User_table_fieldsRepository.find({where:{}});
   
     console.log('m in usertableservice and dbUser_table_fields:',dbUser_table_fields);
     
    //  dbUser_table_fields.map(aField=>{
    // // // 3. Update the in-memory cache with values from the database
    //  this.currentUser_table_fields.FieldName = aField?.FieldName;
    //  this.currentUser_table_fields.FieldType = aField?.FieldType;
    //  })

 return await dbUser_table_fields;
} catch (error) {
    console.error('Error ensuring/loading default User_table:', error);
    throw error; // Re-throw to indicate a critical initialization failure
}
   
  
  
 }


 

}


 export default User_tableService