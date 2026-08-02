import express, { Request, Response, Router } from "express";
import { AppDataSource } from "../../../data-source";

//const app = express();

const router = Router();


    router.route('')
    .get(async (req: Request, res: Response) => { console.log('...........got request.........');
    
    if (!AppDataSource.isInitialized) {
        return res.status(500).json({ status: "Disconnected" });
    }

    const options = AppDataSource.options;
    
    // Safely extract host only if the database type uses a network connection
    const host = (options.type !== "sqlite" && "host" in options) 
        ? options.host 
        : "Local File (No Host)";

    res.json({
        status: "Connected",
        database: options.database,
        type: options.type,
        host: host
    });
});



 
export default router;