import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  schema: 'public',
  name: 'menu_permissions',
})
export class MenuPermissionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'menu_item_id',
  })
  menuItemId: string;

  @Column({
    name: 'permission_id',
  })
  permissionId: string;

  @Column()
  active: boolean;

  @Column({
    name: 'application_id',
  })
  applicationId: string;
}
