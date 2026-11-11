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
  user_action?: string;

  @Column({
    type: 'timestamptz',
  })
  creation_time!: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  update_time?: Date;

  @Column({
    nullable: true,
  })
  ip?: string;

  @Column({
    nullable: true,
  })
  module?: string;
}
