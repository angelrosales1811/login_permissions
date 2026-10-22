import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'role_permissions',
})
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  role_id!: string;

  @Column()
  resource_id!: string;

  @Column()
  permission_id!: string;

  @Column()
  application_id!: string;

  @Column({
    default: true,
  })
  active!: boolean;
}
