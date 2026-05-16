"use strict";
// const eventemitter=require('./notifier')
// // import * as dbUtil from "./dbUtil";
Object.defineProperty(exports, "__esModule", { value: true });
// // const myFile=require('./myFile'); //for module.exports =myClass
// // ///import { myClass } from './myFile';
// // //const dbUtil=require('./dbUtil')
// // const obj=new myFile.myClass();
// // console.log('Are u happy',obj.getMyName());
// // dbUtil.sayHello();
// // async function main(){
// //     const aUser=await dbUtil.getUser();
// //     console.log(`User we got is ${aUser}`);
// // }
// // main()
// function deleteRefreshToken(key:string){
//     for (const token in refreshTokens)
//     {
//       if (token==key){ console.log('found ',key, ' refreshTokens[givenkey]:',refreshTokens[key]);
//            if(refreshTokens[key]){console.log('found and deleting ',refreshTokens[key]); delete refreshTokens[key]; ;
//            }
//       break;}
//     }
// }
// //
// function countRefreshTokensByUser(tokens: { [token: string]: { userId: string } }): { [userId: string]: number } {
//    const userTokenCounts: { [userId: string]: number } = {};
//    Object.values(tokens).forEach(tokenData => {
//        const userId = tokenData.userId;
//        userTokenCounts[userId] = (userTokenCounts[userId] || 0) + 1;
//    });
//    return userTokenCounts;
// }
// const refreshTokens: { [token: string]: { userId: string , withkey:string} } = {};
//  refreshTokens.abc={userId:'one', withkey:'abc'}
//  refreshTokens.pqr={userId:'one', withkey:'pqr'}
//  refreshTokens.xyz={userId:'one', withkey:'xyz'}
//  refreshTokens.bom={userId:'two', withkey: 'bom'}
//  refreshTokens.pnq={userId:'two', withkey: 'pnq'}
// console.log('All tokens');
// for ( const token in refreshTokens){
//     console.log(refreshTokens[token]);
//  }
//  //Userwise
//  console.log('userwise');
//  var tokenCounts = countRefreshTokensByUser(refreshTokens);
//  console.log(tokenCounts);
//  console.log('delete refreshTokens.pqr');
//  deleteRefreshToken('bom');eventemitter.eventEmitter.emit('refreshTokenDeleted','bom');
//  eventemitter.needNotifiers=false;
//  deleteRefreshToken('pnq');eventemitter.eventEmitter.emit('refreshTokenDeleted','pnq')
// console.log('Tokens of user:one');
//  for ( const token in refreshTokens){
//     if(refreshTokens[token].userId=='two'){
//     console.log('atoken of userId two...',refreshTokens[token]);
//     }
// }
//  tokenCounts = countRefreshTokensByUser(refreshTokens);
// console.log(tokenCounts);
// function main(){
//     //eventEmitter.emit('profilechanged')
// }
const ConstantsNEnums_1 = require("../../Special/ConstantsNEnums");
const eventemitter = require('./notifier');
console.log('aaaaaaaaaaaaaaaaaaabbbbbbbbbbbb');
eventemitter.eventEmitter.emit('refreshTokenDeleted', 'bom');
//eventemitter.setNeedNotifier(false);
eventemitter.eventEmitter.emit('refreshTokenDeleted', 'pnq');
console.log(ConstantsNEnums_1.apiEndpoint['/api/emp'].toString());
