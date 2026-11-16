import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'security',
  name: 'audit_log',
})
export class AuditLog {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id!: string;

  @Column({
    name: 'user_id',
    nullable: true,
  })
  userId?: string;

  @Column({
    name: 'module_name',
    nullable: true,
  })
  moduleName?: string;

  @Column({
    name: 'entity_name',
    nullable: true,
  })
  entityName?: string;

  @Column({
    name: 'record_id',
    nullable: true,
  })
  recordId?: string;

  @Column({
    nullable: true,
  })
  action?: string;
  @Column({
    nullable: true,
  })
  success?: boolean;

  @Column({
    name: 'old_values',
    type: 'jsonb',
    nullable: true,
  })
  oldValues?: object;

  @Column({
    name: 'new_values',
    type: 'jsonb',
    nullable: true,
  })
  newValues?: object;

  @Column({
    nullable: true,
  })
  ip?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  created_at?: Date;

  @Column({
    name: 'application_id',
    nullable: true,
  })
  applicationId?: string;
}
