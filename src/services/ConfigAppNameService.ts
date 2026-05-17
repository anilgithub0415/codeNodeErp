//ConfigService
import { Repository } from 'typeorm'; // Import Repository directly
import { Config_AppName } from '../entity/Config_Appname'; // Import your Config entity

//const userRepository = new UserRepository(); // Instantiate your repository
// Define an interface for your cached application settings
export interface ConfigAppNameSettings {
  appname: string|undefined; 

}
 class ConfigAppNameService{

  private configAppNameRepository!: Repository<Config_AppName>;
   /**
     * Initializes the ConfigService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Config.
     */
      async init(repo: Repository<Config_AppName>): Promise<void> {
        this.configAppNameRepository = repo;
        console.log("ConfigAppNameService repository initialized.");
      }
      
      private currentConfigAppName: ConfigAppNameSettings = {
        appname: ''
        };

      getAppName=async():Promise<any>=>{
  
    try {
      // 1. Try to find the existing config record by its primary key
       let dbConfigAppName = await this.configAppNameRepository.find({where:{}});// as there will be only one record, so empty where clause is passed
     
          
      // // 3. Update the in-memory cache with values from the database
       this.currentConfigAppName.appname = dbConfigAppName[0]['appname'];
  
      return await this.currentConfigAppName.appname;
  } catch (error) {
      console.error('Error ensuring/loading default config:', error);
      throw error; // Re-throw to indicate a critical initialization failure
  }
     
    
    
   }
  
 }

 
 export default ConfigAppNameService



