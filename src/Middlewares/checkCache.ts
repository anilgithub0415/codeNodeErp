import { NextFunction , Request, Response} from "express";

const cache=require('../Special/cachemanager');

 //cache middleware--------------------------------------------------
 const checkCache = async (req: Request, res: Response, next: NextFunction) => {
   
    const cachedData = cache.get(req.originalUrl);
    if (cachedData !== undefined && req.method==='GET') {
        console.log('Cache hit for:', req.originalUrl);
        res.send(cachedData); // Send the cached response
         
    } else {
        console.log('No cachedData for:', req.originalUrl, 'proceeding to route');
        // Attach a custom function to the res object to store the response in the cache
        (res as any).sendResponse = (data: any) => {
            cache.set(req.originalUrl, data);
            res.send(data); // Send the original response
        }; 
        next(); // Proceed to the route handler
    }
};
//cache middleware ends ---------------------------------------------

module.exports = checkCache