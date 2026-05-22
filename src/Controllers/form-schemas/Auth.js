const jwt = require('jsonwebtoken');

function auth(req,res,next){

    console.log('req.originalUrl:'+req.originalUrl
    +' method:'+req.originalUrl.includes('/api/'))

    //for login post forgive
    if(
      (req.originalUrl=='/api/config/' )
      || (req.originalUrl=='/api/login/' && req.method=="POST")
      || (req.originalUrl=='/api/signup' && req.method=="POST")
      || (req.originalUrl.includes('/api/Device/') && req.method=="GET")     
       
    ){next();return;}

    //const token = req.headers.authorization.split(' ')[1];
  //  const authHeader = req.header('authorization');

  //Sabak
  //Very importatnt step split it 
  const authHeader = req.header('authorization').split(' ')[1];

    console.log('my authHeader:'+authHeader)
    if(authHeader === null){
     return res.status(401).json({error:"Access-Denied"});
    }

    try{
        
       const verified = jwt.verify(authHeader,"secret");
      // req.id={userid:verified.userid}; //was username
       req.id={username:verified.username};
       next();
       
    }catch(error){
        console.log('js says Invalid Token'+error)
     res.status(401).json({error:"Invalid token"});
    }

}
module.exports={auth}