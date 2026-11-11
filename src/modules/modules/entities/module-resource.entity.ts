import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'module_resources',
})
export class ModuleResource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  module_id!: string;

  @Column()
  resource_id!: string;

  @Column({
    default: true,
  })
  active!: boolean;
}
