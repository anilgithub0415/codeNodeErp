import { NextFunction ,Request,Response} from "express";
import { sayHello } from "../Controllers/test/dbUtil";
import { inject,injectable } from "tsyringe";

import {container} from 'tsyringe'
import { Logger_To_DB, Logger_To_File } from "./Logger";

require('dotenv').config()

const LOGGER_TYPE=process.env.LOGGER_TYPE
if(LOGGER_TYPE=="LOG_TO_FILE"){
        container.register('ILogger',{useClass:Logger_To_File})
} 
else if(LOGGER_TYPE=="LOG_TO_DB"){
        container.register('ILogger',{useClass:Logger_To_DB})
} 
else{
        container.register('ILogger',{useClass:Logger_To_File});
        console.warn("Invalid LOGGER_TYPE, by default LOG_TO_FILE ")
}
interface ILogger{
    write_Log():void
}
  @injectable()
export class RequestLoggerMiddleware{
     mylogger:any;
    constructor(@inject('ILogger') private logger:ILogger){
            this.mylogger=logger;
            
    }

     write_Log=async(req:Request,res:Response,next:NextFunction)=>{
    console.log('m mware saying HI');

    var timestamp=new Date().toISOString(); var method=req.method; var url=req.originalUrl;

    let clientIp=undefined;
    if (req.ips && req.ips.length > 0) {
//        clientIp = req.ips[0]; // Get the first IP in the array (client IP)
console.log('1');

    } else if (req.headers['x-forwarded-for']) {
        console.log('2')//clientIp ='aaaaaaaaaaaaaa'// req.headers['x-forwarded-for'].split(',')[0].trim(); // Get the first IP from the header
    }
     else {
        console.log(req.connection.remoteAddress)//        clientIp = req.ip || req.connection.remoteAddress; // Fallback to req.ip or req.connection.remoteAddress
    }

   // const logMessage = `${timestamp} - ${method} - ${url} - ${clientIp}\n`;

        var logMessage=`${timestamp} - ${method}      -${url}                   -${req.headers}\n`
            this.mylogger.write_Log(logMessage)
            
    next()
     }

    }     



    /*
    i added below line in server.js
    
        app.set('trust proxy', true);

    while generating log i have considered 1. timestamp 2. req.method 3. req.url 4. IP address.
    i tried by following but i could not find ip address which is last column

     
    //use of req.ip
    var logMessage=`${timestamp} - ${method}      -${url}                   -${req.ip}\n`
    
    //use req.ips
    var logMessage=`${timestamp} - ${method}      -${url}                   -${req.ips}\n`

    //use of req.connection.remoteAddress
    var logMessage=`${timestamp} - ${method}      -${url}                   -${req.connection.remoteAddress}\n`
    
    //use of req.headers['x-forwarded-for']
    var logMessage=`${timestamp} - ${method}      -${url}                   -${req.headers['x-forwarded-for']}\n`

    */