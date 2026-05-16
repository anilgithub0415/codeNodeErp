// const Redis=require('Redis');

// main=async ()=>{
        
//     const redisClient=Redis.createClient(); 
//     redisClient.on('error',err=>{
//         console.log('Redis client error:',err);
//     })
//     try{
//     await  redisClient.connect()
//     }
//     catch(err){
//         console.log('Redis connect error:',err);
//     }

//     try{
//         const cachedData = await redisClient.get('myCache')
//         if(cachedData==null){
//             await redisClient.set('myCache',"cached things")
//         }
//         console.log(cachedData);
       

//     }
//     catch(err){
//         console.log('Redis operation error:',err);
//     }
//     finally{
//        // redisClient.quit()
//     }
// }

// main()


const redis = require('redis');

async function main() {
  const redisClient = redis.createClient();

  redisClient.on('error', err => {
    console.error('Redis Client Error:', err);
  });

  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Redis Connect Error:', err);
    return;
  }

}
main()
