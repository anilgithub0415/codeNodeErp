// //ConfigService
// import {Request,Response} from 'express'

// import UserRepository from '../Repositories/UserRepositoryTypeorm'; // Import your TypeORM User Repository

// import { User } from '../Models/User';
// import { UserRepositoryInterface } from '../Models/UserRepositoryInterface';
// import bcrypt from 'bcrypt'; // For password hashing
// // Remove this if utility is not directly used in methods that need it, or define its type
// // const utility=require('../Utilities/Utility'); // Ensure this is correctly imported if needed

// const saltRounds = 10; // Assuming this is defined globally or passed somehow

// const utility=require('../Utilities/Utility');
// type UserUpdateDTO = Partial<Omit<User, 'id' | 'password'>> & {
//   password?: string; // Allow password to be explicitly provided for update
// };


// const userRepository = new UserRepository(); // Instantiate your repository

//  class ConfigService{

// getConfig=async():Promise<User[]>=>{
  
  
//    return await userRepository.getAll()
  
//  }

// }



// module.exports=ConfigService