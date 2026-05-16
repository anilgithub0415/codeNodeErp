import { Entity, PrimaryColumn, Column, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRoleLookup } from './UserRoleLookup'; // Import UserRoleLookup entity

@Entity({ name: 'Permission' })
export class Permission {
    @PrimaryColumn({ type: 'nvarchar', length: 255, name: 'PermissionName' })
    permissionName!: string; // e.g., 'user.create', 'person.view.all', 'assignment.grade'

    @Column({ type: 'nvarchar', length: 500, nullable: true })
    description?: string | null;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    // --- Many-to-Many relationship with UserRoleLookup ---
    // Many permissions can be assigned to many roles.
    // The inverse side of UserRoleLookup.permissions
    @ManyToMany(() => UserRoleLookup, userRole => userRole.permissions)
    roles?: UserRoleLookup[];

    // Audit fields
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}