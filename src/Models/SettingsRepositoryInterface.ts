import { SecuritySettings } from "./SecuritySettings";

export interface SettingsRepositoryInterface {
    save(Settings: SecuritySettings): Promise<SecuritySettings>;
    getById(id: string): Promise<SecuritySettings | undefined>;
    getAll(): Promise<SecuritySettings[]>;
  }
  
 