import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'role_modules',
})
export class RoleModule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  role_id!: string;

  @Column()
  module_id!: string;

  @Column()
  application_id!: string;

  @Column({
    default: true,
  })
  active!: boolean;

  @Column({
    nullable: true,
  })
  created_by?: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  created_at?: Date;

  @Column({
    nullable: true,
  })
  updated_by?: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  updated_at?: Date;

  @Column({
    nullable: true,
  })
  ip_creation?: string;

  @Column({
    nullable: true,
  })
  ip_update?: string;
}
