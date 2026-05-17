//ConfigService
import { Repository } from 'typeorm'; // Import Repository directly
import { Config } from '../entity/Config'; // Import your Config entity
import { getConfigAppNameServiceRepository} from '../dependencies'
import { BackendGlobalConfigDto } from '../dto/config.dto';
//import UserRepository from '../Repositories/UserRepositoryTypeorm'; // Import your TypeORM User Repository

import { User } from '../Models/User';



//const userRepository = new UserRepository(); // Instantiate your repository
// Define an interface for your cached application settings
export interface ConfigSettings {
  appname: string|undefined; 
  config_useraddthru: string|undefined; 
}
 class ConfigService{

  private configRepository!: Repository<Config>;
   /**
     * Initializes the ConfigService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Config.
     */
      async init(repo: Repository<Config>): Promise<void> {
        this.configRepository = repo;
        console.log("ConfigService repository initialized.");
      }
      private currentConfig: ConfigSettings = {
        appname: '',
        config_useraddthru:''
    };

    getAppName=async():Promise<any>=>{
      const configAppNameService = getConfigAppNameServiceRepository(); // Get the singleton instance
      const currentConfigAppName =await configAppNameService.getAppName(); // Get the cached config
      return await currentConfigAppName;
    }
getConfig=async():Promise<any>=>{

  const CONFIG_KEY = await this.getAppName();
  try {
    // 1. Try to find the existing config record by its primary key
     let dbConfig = await this.configRepository.findOne({ where: { appname: CONFIG_KEY } });
   
    
    // // 3. Update the in-memory cache with values from the database
     this.currentConfig.appname = dbConfig?.appname;
     this.currentConfig.config_useraddthru = dbConfig?.config_useraddthru;

 return await this.currentConfig;
} catch (error) {
    console.error('Error ensuring/loading default config:', error);
    throw error; // Re-throw to indicate a critical initialization failure
}
   
  
  
 }


 

}


 export default ConfigService