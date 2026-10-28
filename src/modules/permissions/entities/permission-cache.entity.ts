import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Unique('permission_cache_user_resource_permission_key', [
  'user_id',
  'application_id',
  'resource_id',
  'permission_code',
])
@Entity({
  schema: 'security',
  name: 'permission_cache',
})
export class PermissionCache {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user_id!: string;

  @Column()
  role_id!: string;

  @Column()
  resource_id!: string;

  @Column()
  application_id!: string;

  @Column()
  permission_code!: string;

  @Column({
    type: 'timestamptz',
  })
  calculated_at!: Date;

  @Column()
  active!: boolean;
}
