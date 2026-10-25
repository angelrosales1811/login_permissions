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

  @Column({
    type: 'jsonb',
  })
  permissions!: Record<string, unknown>;

  @Column({
    type: 'timestamp',
  })
  updated_at!: Date;
}
