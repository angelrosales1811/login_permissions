import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
