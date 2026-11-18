import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'security',
  name: 'user_access_log',
})
export class UserAccessLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    nullable: true,
  })
  user_id?: string;

  @Column({
    nullable: true,
    length: 100,
  })
  action?: string;

  @Column({
    nullable: true,
    length: 100,
  })
  module_name?: string;

  @Column({
    nullable: true,
    length: 255,
  })
  endpoint?: string;

  @Column({
    nullable: true,
    length: 10,
  })
  method?: string;

  @Column({
    nullable: true,
    length: 45,
  })
  ip?: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  user_agent?: string;

  @Column({
    nullable: true,
  })
  application_id?: string;

  @CreateDateColumn()
  created_at!: Date;
}
