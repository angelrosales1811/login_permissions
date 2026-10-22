import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'user_roles',
})
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user_id!: string;

  @Column()
  role_id!: string;

  @Column({
    default: true,
  })
  active!: boolean;
}
