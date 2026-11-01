export class MenuItemResponseDto {
  id: string;

  name: string;

  route: string;

  icon?: string;
}

export class MenuResponseDto {
  id: string;

  name: string;

  icon?: string;

  items: MenuItemResponseDto[];
}
