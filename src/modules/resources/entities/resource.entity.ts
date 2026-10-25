import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'resources',
})
export class Resource {
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

  @Column()
  application_id!: string;

  @Column({
    default: true,
  })
  active!: boolean;
}
