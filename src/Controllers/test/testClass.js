  class class1{
    logger;
    constructor(logger){
            this.logger=logger;
    }
    method1(){
        this.logger.error(new Error("Invalid arguments"))
    }
}

 class Logger{
   error(e){
    console.log('Error:',e.message,' occured ');
   }
}

var obj_error=new Logger()
var obj=new class1(obj_error);
obj.method1()