import { Repository,EntityManager } from 'typeorm'; 
import { Leadsource } from '../entity/LeadSource';

export class LeadSourceService{
  private leadSourceRepository!: Repository<Leadsource>;

   async init(leadSourceRepo: Repository<Leadsource>): Promise<void> {
                this.leadSourceRepository = leadSourceRepo;
                
                console.log("LeadSourceService repositories initialized.");
            }

  //for LeadSources lookup

        async getLeadsources(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<Leadsource[]> {

             if (!this.leadSourceRepository) {
                        throw new Error("LeadsourceService repository not initialized. Call init() first.");
                    }
                   
                    
                    const leadSourceRepository = manager ? manager.getRepository(Leadsource) : this.leadSourceRepository;
                    const leadsources= await leadSourceRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all 
                    
                    
                    return leadsources;
                }
}

export default LeadSourceService