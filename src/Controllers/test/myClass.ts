
export default class myClass{
    logger;
    constructor(logger:ICOmmon){
            this.logger=logger;
    }
    method1(){
        console.log('m method1 of myClass');
        this.logger.getData('logme')
    }
}//------------------------------------------------
interface ICOmmon{
      getData(str1:any):void
}
export  class Messenger implements ICOmmon{
    getData(msg:string){
        console.log( 'Message Received:',msg);
        
    }
    error(e:Error){
          console.log( 'Message Received:',e.message);
          
    }
}

export  class Logger{
    getData(msg:string){
        console.log('Logger getData:',msg);
        
    }
    error(e:Error){
          console.log(e.message,' occured');
          
    }
}//-------------------------------------------------

console.log('myClass testing');
var obj_Logger=new Messenger()
var obj_myClass=new myClass(obj_Logger)
obj_myClass.method1();





