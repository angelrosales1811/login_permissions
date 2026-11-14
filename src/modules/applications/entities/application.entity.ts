import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'applications',
})
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    length: 50,
  })
  code!: string;

  @Column({
    length: 100,
  })
  name!: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  description?: string;

  @Column({
    nullable: true,
  })
  icon?: string;

  @Column({
    nullable: true,
  })
  route?: string;

  @Column({
    default: true,
  })
  active!: boolean;

  @Column({
    nullable: true,
  })
  module?: string;

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
