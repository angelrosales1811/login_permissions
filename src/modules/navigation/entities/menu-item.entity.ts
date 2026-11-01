export class MenuItemEntity {
  id: string;

  menuId: string;

  internalName: string;

  externalName: string;

  route?: string;

  icon?: string;

  displayOrder: number;

  active: boolean;

  moduleId?: string;

  applicationId: string;
}
