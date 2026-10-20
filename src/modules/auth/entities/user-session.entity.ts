import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'user_sessions',
})
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user_id!: string;

  @Column({
    type: 'timestamptz',
  })
  login_at!: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  logout_at?: Date;

  @Column({
    nullable: true,
  })
  ip?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  user_agent?: string;

  @Column({
    default: true,
  })
  active!: boolean;
}
