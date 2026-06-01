


// src/entity/Product.ts
import { Entity, PrimaryColumn, ManyToOne,JoinColumn, Column, PrimaryGeneratedColumn ,Index, CreateDateColumn, UpdateDateColumn} from 'typeorm';
import { Tenant } from './Tenant';


// This class defines the structure of your 'Product' table in the database.
@Entity({ name: 'Tenant_custom_scripts' }) 
@Index(["tenantId","hookPoint","isActive"])
export class Tenant_custom_scripts {

    @PrimaryGeneratedColumn()
    id!: number;
 
     @Column({type:'int'})
    tenantId!:number;
    
    // 2. Define the TypeORM Relation
    @ManyToOne(() => Tenant, (tenant) => tenant.tenantscripts, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
    tenant!: Tenant;

    @Column({name:"hook_point",length:100})
    hookPoint!:string
 
    @Column({name:"script_name"})
    scriptName!:string

    @Column({name:"script_code",type:"nvarchar",length:"MAX"})
    scriptCode!:string;

    @Column({name:"is_active",type:"bit",default:true})
    isActive!:boolean;

    @Column({name:"execution_timeout_ms",type:"int",default:1000})
    executionTimeoutMs!:number;

    @Column({type:"int", default:1})
    version!:number;

    @CreateDateColumn({name:"created_at"})
    createdAt!:Date;  
    
    @UpdateDateColumn({name:"updated_at"})
    updatedAt!:Date;

}

