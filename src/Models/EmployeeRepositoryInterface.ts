import { Employee } from "./Employee";

export interface EmpRepositoryInterface {
    save(employee: Employee): Promise<Employee>;
    getById(employeeId: string): Promise<Employee | undefined>;
    getAll(): Promise<Employee[]>;
  }
  
  