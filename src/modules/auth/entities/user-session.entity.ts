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

  @Column()
  login_at!: Date;

  @Column({
    nullable: true,
  })
  logout_at?: Date;

  @Column({
    nullable: true,
  })
  ip?: string;

  @Column({
    nullable: true,
  })
  user_agent?: string;

  @Column()
  active!: boolean;
}
