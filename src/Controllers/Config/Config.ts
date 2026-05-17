

//Please refer note which is written below

import express, { Router, Request, Response } from 'express';
import { getConfigServiceRepository } from '../../dependencies';

var router=Router();

// Middleware to ensure configService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
  // In a real app, you'd probably have an Auth middleware before this
  // to check if the user is an admin for accessing config.
  try {
      const configService = getConfigServiceRepository(); // Attempt to get the service
      // You could attach it to res.locals or req for later use if desired,
      // but directly calling the getter in each route is also fine.
      next();
  } catch (error: any) {
      console.error('ConfigService not initialized when requested:', error.message);
      res.status(500).json({ message: 'Server initialization error. Config service not ready.' });
  }
});

  

router.route('')
.get(async (req:Request,res:Response)=>{
    try{
   
      const configService = getConfigServiceRepository(); // Get the singleton instance
        const currentConfig =await configService.getConfig(); // Get the cached config
              
        res.status(200).json(currentConfig);
    }
    catch(error:any){
      res.status(500).json({"message":error.message});//"Failed to retrieve Config"
    }
})
    


export default router;


 /*
 Note: 3 tables below and there significance
  1. settings
      this holds accessTokenLifetime, refreshTokenLifetime 
      these fields are visible thru settings functionality to change
  2. config
     this holds appname, useraddthru which are internal things not seen by end user and manage few things like users creation
  3. config_appname
     this only holds appname , depending on this appname config record will be read. 
     this is again internal and not seen by end user
 */


     /*
     There is Config controller exists but no ConfigAppName controller, as it doesnt need get, put, post, it is to store appname thats it
     In ConfigService, we imported getConfigAppNameServiceRepository from dependencies,
     for getting AppName stored in Config_AppName table thru getAppName method

     */

