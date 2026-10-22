import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'user_profiles',
})
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  auth_user_id!: string;

  @Column()
  email!: string;

  @Column({
    nullable: true,
  })
  full_name?: string;

  @Column({
    nullable: true,
  })
  avatar_url?: string;

  @Column({
    default: true,
  })
  active!: boolean;
}
