import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'permissions',
})
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  internal_name!: string;

  @Column()
  external_name!: string;

  @Column()
  permission_code!: string;

  @Column({
    nullable: true,
  })
  description?: string;

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
