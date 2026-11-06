import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { MenuItemEntity } from './entities/menu-item.entity';
import { MenuPermissionEntity } from './entities/menu-permission.entity';
import { MenuEntity } from './entities/menu.entity';

import { CreateNavigationDto } from './dto/create-navigation.dto';
import { MenuItemResponseDto, MenuResponseDto } from './dto/menu-response.dto';
import { UpdateNavigationDto } from './dto/update-navigation.dto';

type PermissionRow = {
  permission_id: string;
};

@Injectable()
export class NavigationService {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuRepository: Repository<MenuEntity>,

    @InjectRepository(MenuItemEntity)
    private readonly menuItemRepository: Repository<MenuItemEntity>,

    @InjectRepository(MenuPermissionEntity)
    private readonly menuPermissionRepository: Repository<MenuPermissionEntity>,

    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  create(createNavigationDto: CreateNavigationDto) {
    return 'This action adds a new navigation';
  }

  findAll() {
    return `This action returns all navigation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} navigation`;
  }

  update(id: number, updateNavigationDto: UpdateNavigationDto) {
    return `This action updates a #${id} navigation`;
  }

  remove(id: number) {
    return `This action removes a #${id} navigation`;
  }

  async getMenusByUser(userId: string): Promise<MenuResponseDto[]> {
    const permissions: PermissionRow[] = await this.dataSource.query(
      `
        SELECT DISTINCT permission_id
        FROM security.permission_cache
        WHERE user_id = $1
    `,
      [userId]
    );

    if (!permissions.length) {
      return [];
    }

    const permissionIds = permissions.map((item) => item.permission_id);

    const menuPermissions = await this.menuPermissionRepository
      .createQueryBuilder('mp')
      .where('mp.active = true')
      .andWhere('mp.permissionId IN (:...permissionIds)', {
        permissionIds,
      })
      .getMany();

    if (!menuPermissions.length) {
      return [];
    }

    const menuItemIds = menuPermissions.map((item) => item.menuItemId);

    const menuItems = await this.menuItemRepository
      .createQueryBuilder('mi')
      .where('mi.active = true')
      .andWhere('mi.id IN (:...menuItemIds)', {
        menuItemIds,
      })
      .orderBy('mi.displayOrder', 'ASC')
      .getMany();

    if (!menuItems.length) {
      return [];
    }

    const menuIds = [...new Set(menuItems.map((item) => item.menuId))];

    const menus = await this.menuRepository
      .createQueryBuilder('m')
      .where('m.active = true')
      .andWhere('m.id IN (:...menuIds)', {
        menuIds,
      })
      .orderBy('m.displayOrder', 'ASC')
      .getMany();

    const response: MenuResponseDto[] = [];

    for (const menu of menus) {
      const items: MenuItemResponseDto[] = menuItems
        .filter((item) => item.menuId === menu.id)
        .map((item) => ({
          id: item.id,
          name: item.externalName,
          route: item.route ?? undefined,
          icon: item.icon ?? undefined,
        }));

      response.push({
        id: menu.id,
        name: menu.externalName,
        icon: menu.icon,
        items,
      });
    }

    return response;
  }

  async hasAvailableMenus(userId: string): Promise<boolean> {
    const menus = await this.getMenusByUser(userId);

    return menus.length > 0;
  }
}
