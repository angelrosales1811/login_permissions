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
}
