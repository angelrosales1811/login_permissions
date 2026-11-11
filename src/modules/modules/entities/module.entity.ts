import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'modules',
})
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  internal_name!: string;

  @Column()
  external_name!: string;

  @Column({
    nullable: true,
  })
  route?: string;

  @Column({
    nullable: true,
  })
  icon?: string;

  @Column({
    default: 0,
  })
  display_order!: number;

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
