import { Person } from "../entity/Person";

export type UpdatePersonDTO = Partial<Omit<Person, 'id' | 'createdAt' | 'updatedAt' >> & {
  
};