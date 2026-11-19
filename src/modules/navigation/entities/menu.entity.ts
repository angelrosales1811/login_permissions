import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from '../../../common/interfaces/auditable-entity.interface';

@Entity({
  schema: 'public',
  name: 'menus',
})
export class Menu implements AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'internal_name',
  })
  internalName!: string;

  @Column({
    name: 'external_name',
  })
  externalName!: string;

  @Column({
    nullable: true,
  })
  icon?: string;

  @Column({
    name: 'display_order',
  })
  displayOrder!: number;

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
