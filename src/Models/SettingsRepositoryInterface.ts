import { Settings } from "./Settings";

export interface SettingsRepositoryInterface {
    save(Settings: Settings): Promise<Settings>;
    getById(id: string): Promise<Settings | undefined>;
    getAll(): Promise<Settings[]>;
  }
  
 