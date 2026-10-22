import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
    nullable: true,
  })
  user_id?: string;

  @Column({
    nullable: true,
  })
  module_name?: string;

  @Column({
    nullable: true,
  })
  entity_name?: string;

  @Column({
    nullable: true,
  })
  record_id?: string;

  @Column({
    nullable: true,
  })
  action?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  old_values?: object;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  new_values?: object;

  @Column({
    nullable: true,
  })
  ip?: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  created_at?: Date;

  @Column({
    nullable: true,
  })
  application_id?: string;
}
