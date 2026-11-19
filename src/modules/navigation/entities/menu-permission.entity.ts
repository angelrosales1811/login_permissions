import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from '../../../common/interfaces/auditable-entity.interface';

@Entity({
  schema: 'public',
  name: 'menu_permissions',
})
export class MenuPermissionEntity implements AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'menu_item_id',
  })
  menuItemId!: string;

  @Column({
    name: 'permission_id',
  })
  permissionId!: string;

  @Column()
  active!: boolean;

  @Column({
    name: 'application_id',
  })
  applicationId!: string;

  @Column({
    name: 'created_by',
    type: 'uuid',
    nullable: true,
  })
  created_by?: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    nullable: true,
  })
  created_at?: Date | null;

  @Column({
    name: 'updated_by',
    type: 'uuid',
    nullable: true,
  })
  updated_by?: string | null;

  @Column({
    name: 'updated_at',
    type: 'timestamptz',
    nullable: true,
  })
  updated_at?: Date | null;

  @Column({
    name: 'ip_creation',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ip_creation?: string | null;

  @Column({
    name: 'ip_update',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ip_update?: string | null;
}
