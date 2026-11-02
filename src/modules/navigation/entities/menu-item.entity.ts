import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'menu_items',
})
export class MenuItemEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'menu_id',
  })
  menuId: string;

  @Column({
    name: 'internal_name',
  })
  internalName: string;

  @Column({
    name: 'external_name',
  })
  externalName: string;

  @Column({
    nullable: true,
  })
  route?: string;

  @Column({
    nullable: true,
  })
  icon?: string;

  @Column({
    name: 'display_order',
  })
  displayOrder: number;

  @Column()
  active: boolean;

  @Column({
    name: 'module_id',
    nullable: true,
  })
  moduleId?: string;

  @Column({
    name: 'application_id',
  })
  applicationId: string;

  @Column({
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
  })
  updatedAt: Date;
}
