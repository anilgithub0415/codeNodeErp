import { User } from "../entity/User";

export interface UserRepositoryInterface {
    save(User: User): Promise<User>;
    getById(id: number): Promise<User | undefined>;
    getAll(): Promise<User[]>;
  }
  
 