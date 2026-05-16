import {inject,injectable} from 'tsyringe';
const fs=require('fs')

const Allow_Log_Lines=12; 
const logFilename='Log_APIURL_Hits.txt';

@injectable()
export class Logger_To_DB{

    write_Log(logMessage:string){
    //write log to DB
    console.log('writing log to DB, u cant see: ',logMessage);
    
    }
  }
  
  @injectable()
  export class Logger_To_File{
  
    write_Log(logMessage:string){
      fs.appendFile(logFilename,logMessage,(err:any)=>{ })
    }
   Delete_First_Few_LogLines(noOflinestoDelete=1){
      const filePath = logFilename;
  
      fs.readFile(filePath, 'utf-8', (err:any, data:any) => {
        if (err) {
          console.error(err);
          //return res.status(500).send('Error reading the file');
        }
  
      const lines = data.split('\n')
      const lineCount = data.split('\n').length;
      console.log(`Total lines in the file: ${lineCount}`);
      if(lineCount>=Allow_Log_Lines){
        lines.splice(1,noOflinestoDelete);
        const updatedData = lines.join('\n');
  
      fs.writeFile(filePath, updatedData, 'utf8', (err:any) => {
        
        
      });
     }
    });
  }
  
  }