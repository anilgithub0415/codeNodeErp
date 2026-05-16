// //dataController
// export const get_Data=(): Promise<{ id: string; nm: string }[]> =>{
//     return new Promise((resolve, reject) => {
//       resolve([{"id":"1","nm":"one"},{"id":"2","nm":"two"},{"id":"3","nm":"three"}]);
//       // You would typically call reject() in case of an error in an async operation.
//     });
//   }
  
  //test_dbOps.ts
  
  import {Request,Response} from 'express'
var dc=require('./dataController')
export const getData =async (req:Request,res:Response)=>{
   // var asyncFun= new Promise((resolve,reject)=>{
       
        setTimeout(async() => {
        var data=await dc.get_Data()
            return res.status(200).json(data)
        }, 2000);
 //  })
}

//module.exports=getData


// //test.ts
// import express, {Request,Response, Router} from 'express';
// import {getData} from './test_dbOps'
// const Express=express();

// var router=Router()

// router.route('')
// .get(getData)

// module.exports = router;