import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'user_preferences' })
export class UserPreferences {
    @PrimaryColumn({ type: 'int', name: 'user_id' })
    userId!: number;

    @Column({type:'int'})
    tenantId!:number;

    @Column({ type: 'nvarchar', length: 50, default: 'Aura' })
    preset!: string;

    @Column({ type: 'nvarchar', length: 50, default: 'emerald' })
    primary!: string;

    // Allows null/undefined if a custom surface isn't selected yet
    @Column({ type: 'nvarchar', length: 50, nullable: true, default: null })
    surface!: string | null;

    @Column({ type: 'bit', name: 'dark_theme', default: false })
    darkTheme!: boolean;

    @Column({ type: 'nvarchar', length: 20, name: 'menu_mode', default: 'static' })
    menuMode!: string;

    @UpdateDateColumn({ type: 'datetime2', name: 'updated_at' })
    updatedAt!: Date;
}
