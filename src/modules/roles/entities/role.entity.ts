import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'roles',
})
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  internal_name!: string;

  @Column()
  external_name!: string;

  @Column({
    nullable: true,
  })
  description?: string;

  @Column({
    default: true,
  })
  active!: boolean;
}
