import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { Menu } from './entities/menu.entity';

import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

import { AuditContextService } from '../../common/services/audit-context.service';
import { AuditEntityService } from '../../common/services/audit-entity.service';
import { AuditLogService } from '../../common/services/audit-log.service';

import { AUDIT_ACTIONS } from '../../common/constants/audit-actions.constant';
import { AUDIT_ENTITIES } from '../../common/constants/audit-entities.constant';
import { AUDIT_MODULES } from '../../common/constants/audit-modules.constant';

import { DataSource, Repository } from 'typeorm';

import { Module } from '../modules/entities/module.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { MenuItemEntity } from './entities/menu-item.entity';
import { MenuPermissionEntity } from './entities/menu-permission.entity';

import { CatalogFilterDto } from '../../common/dto/catalog-filter.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateMenuPermissionDto } from './dto/create-menu-permission.dto';
import { MenuItemResponseDto, MenuResponseDto } from './dto/menu-response.dto';
import { ReorderMenuItemDto } from './dto/reorder-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdateMenuPermissionsDto } from './dto/update-menu-permissions.dto';

import { AuditLog } from '../audit/entities/audit-log.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';

import { NavigationHistoryQueryDto } from './dto/navigation-history-query.dto';
//import { NavigationExportQueryDto } from './dto/navigation-export-query.dto';

type PermissionRow = {
  permission_id: string;
};

@Injectable()
export class NavigationService {
  constructor(
    @InjectRepository(MenuItemEntity)
    private readonly menuItemRepository: Repository<MenuItemEntity>,

    @InjectRepository(MenuPermissionEntity)
    private readonly menuPermissionRepository: Repository<MenuPermissionEntity>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,

    private readonly auditContextService: AuditContextService,
    private readonly auditEntityService: AuditEntityService,
    private readonly auditLogService: AuditLogService
  ) {}

  private async buildMenusFromPermissionIds(permissionIds: string[]): Promise<MenuResponseDto[]> {
    if (!permissionIds.length) {
      return [];
    }

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

    return menus.map((menu) => ({
      id: menu.id,
      name: menu.externalName,
      icon: menu.icon,
      items: menuItems
        .filter((item) => item.menuId === menu.id)
        .map((item) => ({
          id: item.id,
          name: item.externalName,
          route: item.route ?? undefined,
          icon: item.icon ?? undefined,
        })),
    }));
  }
  /////////////////////////////////
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

    return this.buildMenusFromPermissionIds(permissionIds);
  }
  ////////////////////////////////
  async getMenuSimulationByUser(userId: string): Promise<MenuResponseDto[]> {
    const menus = await this.getMenusByUser(userId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.SIMULATE_USER_MENU,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU,
      recordId: userId,
      newValues: {
        simulatedUserId: userId,
      },
    });

    return menus;
  }

  async getMenuSimulationByRole(roleId: string): Promise<MenuResponseDto[]> {
    const permissions = await this.rolePermissionRepository.find({
      where: {
        role_id: roleId,
        active: true,
      },
    });

    const permissionIds = permissions.map((item) => item.permission_id);

    const menus = await this.buildMenusFromPermissionIds(permissionIds);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.SIMULATE_ROLE_MENU,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU,
      recordId: roleId,
      newValues: {
        simulatedRoleId: roleId,
      },
    });

    return menus;
  }

  async getNavigationHistory(query: NavigationHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.auditRepository
      .createQueryBuilder('audit')
      .where('audit.moduleName = :module', {
        module: AUDIT_MODULES.NAVIGATION,
      });

    if (query.action) {
      qb.andWhere('audit.action = :action', {
        action: query.action,
      });
    }

    qb.orderBy('audit.created_at', 'DESC');

    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [items, total] = await qb.getManyAndCount();
    await this.auditLogService.record({
      action: AUDIT_ACTIONS.VIEW_NAVIGATION_HISTORY,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU,
      recordId: undefined,
      newValues: {
        filters: query,
      },
    });
    return {
      page,
      limit,
      total,
      items,
    };
  }

  async exportNavigation(format: 'json' | 'csv') {
    const menus = await this.menuRepository.find({
      order: {
        displayOrder: 'ASC',
      },
    });

    const items = await this.menuItemRepository.find();

    const permissions = await this.menuPermissionRepository.find();

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.EXPORT_NAVIGATION,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU,
      recordId: undefined,
      newValues: {
        format,
        menus: menus.length,
        menuItems: items.length,
        menuPermissions: permissions.length,
      },
    });
    if (format === 'json') {
      return {
        menus,
        menuItems: items,
        menuPermissions: permissions,
      };
    }

    return {
      format: 'csv',
      rows: permissions.length,
      data: permissions.map((p) => ({
        menuItemId: p.menuItemId,
        permissionId: p.permissionId,
        applicationId: p.applicationId,
        active: p.active,
      })),
    };
  }

  async hasAvailableMenus(userId: string): Promise<boolean> {
    const menus = await this.getMenusByUser(userId);

    return menus.length > 0;
  }

  async createMenu(dto: CreateMenuDto): Promise<Menu> {
    const exists = await this.menuRepository.findOne({
      where: {
        internalName: dto.internal_name,
        applicationId: dto.application_id,
      },
    });

    if (exists) {
      throw new ConflictException('El menú ya existe');
    }

    const displayOrderExists = await this.menuRepository.findOne({
      where: {
        applicationId: dto.application_id,
        displayOrder: dto.display_order,
        active: true,
      },
    });

    if (displayOrderExists) {
      throw new ConflictException(`Ya existe un menú activo con displayOrder ${dto.display_order}`);
    }

    const menu = this.menuRepository.create({
      internalName: dto.internal_name,
      externalName: dto.external_name,
      icon: dto.icon,
      displayOrder: dto.display_order,
      applicationId: dto.application_id,
      active: true,
    });

    const context = this.auditContextService.getContext();
    if (!context.userId) {
      throw new UnauthorizedException('Audit context not initialized');
    }

    this.auditEntityService.applyCreationAudit(menu, context);

    const saved = await this.menuRepository.save(menu);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.CREATE_MENU,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU,
      recordId: saved.id,
      applicationId: saved.applicationId,
      newValues: { ...saved },
    });

    return saved;
  }

  async findMenus(query?: CatalogFilterDto): Promise<Menu[]> {
    let where = {};

    if (!query?.includeInactive) {
      where =
        query?.active !== undefined
          ? {
              active: query.active,
            }
          : {
              active: true,
            };
    }

    return this.menuRepository.find({
      where,
      order: {
        displayOrder: 'ASC',
      },
    });
  }

  async findMenuById(id: string): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException('Menú no encontrado');
    }

    return menu;
  }

  async findMenuItemById(id: string): Promise<MenuItemEntity> {
    const item = await this.menuItemRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Menu Item no encontrado');
    }

    return item;
  }

  async updateMenu(id: string, dto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.findMenuById(id);

    const oldValues = {
      ...menu,
    };

    if (dto.display_order !== undefined && dto.display_order !== menu.displayOrder) {
      const duplicateOrder = await this.menuRepository.findOne({
        where: {
          applicationId: menu.applicationId,
          displayOrder: dto.display_order,
          active: true,
        },
      });

      if (duplicateOrder && duplicateOrder.id !== menu.id) {
        throw new ConflictException(
          `Ya existe un menú activo con displayOrder ${dto.display_order}`
        );
      }
    }

    if (dto.internal_name !== undefined) {
      menu.internalName = dto.internal_name;
    }

    if (dto.external_name !== undefined) {
      menu.externalName = dto.external_name;
    }

    if (dto.icon !== undefined) {
      menu.icon = dto.icon;
    }

    if (dto.display_order !== undefined) {
      menu.displayOrder = dto.display_order;
    }

    if (dto.application_id !== undefined) {
      menu.applicationId = dto.application_id;
    }

    const context = this.auditContextService.getContext();
    if (!context.userId) {
      throw new UnauthorizedException('Audit context not initialized');
    }

    this.auditEntityService.applyUpdateAudit(menu, context);

    const updated = await this.menuRepository.save(menu);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.UPDATE_MENU,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU,
      recordId: updated.id,
      applicationId: updated.applicationId,
      oldValues,
      newValues: {
        ...updated,
      },
    });

    return updated;
  }

  async updateMenuStatus(id: string, active: boolean): Promise<Menu> {
    const menu = await this.findMenuById(id);

    const previousActive = menu.active;

    const oldValues = {
      ...menu,
    };

    menu.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(menu, context);

    const updated = await this.menuRepository.save(menu);

    const action =
      !previousActive && active
        ? AUDIT_ACTIONS.REACTIVATE_MENU
        : previousActive && !active
          ? AUDIT_ACTIONS.DEACTIVATE_MENU
          : active
            ? AUDIT_ACTIONS.REACTIVATE_MENU
            : AUDIT_ACTIONS.DEACTIVATE_MENU;

    await this.auditLogService.record({
      action,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU,
      recordId: updated.id,
      applicationId: updated.applicationId,
      oldValues,
      newValues: {
        id: updated.id,
        active: updated.active,
      },
    });

    return updated;
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItemEntity> {
    await this.findMenuById(dto.menu_id);

    const module = await this.moduleRepository.findOne({
      where: {
        id: dto.module_id,
        active: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Módulo no encontrado');
    }

    const exists = await this.menuItemRepository.findOne({
      where: {
        menuId: dto.menu_id,
        displayOrder: dto.display_order,
        active: true,
      },
    });

    if (exists) {
      throw new ConflictException(`Ya existe un Menu Item con displayOrder ${dto.display_order}`);
    }

    const item = this.menuItemRepository.create({
      menuId: dto.menu_id,
      moduleId: dto.module_id,
      internalName: dto.internal_name,
      externalName: dto.external_name,
      route: dto.route,
      icon: dto.icon,
      displayOrder: dto.display_order,
      applicationId: dto.application_id,
      active: true,
    });

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyCreationAudit(item, context);

    const saved = await this.menuItemRepository.save(item);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.CREATE_MENU_ITEM,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU_ITEM,
      recordId: saved.id,
      applicationId: saved.applicationId,
      newValues: { ...saved },
    });

    return saved;
  }

  async findMenuItems(menuId: string): Promise<MenuItemEntity[]> {
    return this.menuItemRepository.find({
      where: {
        menuId,
        active: true,
      },
      order: {
        displayOrder: 'ASC',
      },
    });
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItemEntity> {
    const menuItem = await this.findMenuItemById(id);

    const oldValues = { ...menuItem };

    if (dto.display_order !== undefined && dto.display_order !== menuItem.displayOrder) {
      const duplicateOrder = await this.menuItemRepository.findOne({
        where: {
          menuId: menuItem.menuId,
          displayOrder: dto.display_order,
          active: true,
        },
      });

      if (duplicateOrder && duplicateOrder.id !== menuItem.id) {
        throw new ConflictException(
          `Ya existe un Menu Item activo con displayOrder ${dto.display_order}`
        );
      }
    }

    if (dto.module_id !== undefined) {
      const module = await this.moduleRepository.findOne({
        where: {
          id: dto.module_id,
          active: true,
        },
      });

      if (!module) {
        throw new NotFoundException('Módulo no encontrado');
      }

      menuItem.moduleId = dto.module_id;
    }

    menuItem.internalName = dto.internal_name ?? menuItem.internalName;

    menuItem.externalName = dto.external_name ?? menuItem.externalName;

    menuItem.route = dto.route ?? menuItem.route;

    menuItem.icon = dto.icon ?? menuItem.icon;

    menuItem.displayOrder = dto.display_order ?? menuItem.displayOrder;

    menuItem.applicationId = dto.application_id ?? menuItem.applicationId;

    const context = this.auditContextService.getContext();

    if (!context.userId) {
      throw new UnauthorizedException('Audit context not initialized');
    }

    this.auditEntityService.applyUpdateAudit(menuItem, context);

    const updated = await this.menuItemRepository.save(menuItem);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.UPDATE_MENU_ITEM,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU_ITEM,
      recordId: updated.id,
      applicationId: updated.applicationId,
      oldValues,
      newValues: { ...updated },
    });

    return updated;
  }

  async reorderMenuItem(id: string, dto: ReorderMenuItemDto): Promise<MenuItemEntity> {
    const menuItem = await this.findMenuItemById(id);

    const oldValues = {
      displayOrder: menuItem.displayOrder,
    };

    const duplicateOrder = await this.menuItemRepository.findOne({
      where: {
        menuId: menuItem.menuId,
        displayOrder: dto.display_order,
        active: true,
      },
    });

    if (duplicateOrder && duplicateOrder.id !== menuItem.id) {
      throw new ConflictException(
        `Ya existe un Menu Item activo con displayOrder ${dto.display_order}`
      );
    }

    menuItem.displayOrder = dto.display_order;

    const context = this.auditContextService.getContext();

    if (!context.userId) {
      throw new UnauthorizedException('Audit context not initialized');
    }

    this.auditEntityService.applyUpdateAudit(menuItem, context);

    const updated = await this.menuItemRepository.save(menuItem);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.REORDER_MENU_ITEM,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU_ITEM,
      recordId: updated.id,
      applicationId: updated.applicationId,
      oldValues,
      newValues: {
        displayOrder: updated.displayOrder,
      },
    });

    return updated;
  }

  async updateMenuItemStatus(id: string, active: boolean): Promise<MenuItemEntity> {
    const menuItem = await this.findMenuItemById(id);

    const previousActive = menuItem.active;

    const oldValues = {
      ...menuItem,
    };

    if (active) {
      const duplicateOrder = await this.menuItemRepository.findOne({
        where: {
          menuId: menuItem.menuId,
          displayOrder: menuItem.displayOrder,
          active: true,
        },
      });

      if (duplicateOrder && duplicateOrder.id !== menuItem.id) {
        throw new ConflictException(
          `Ya existe un Menu Item activo con displayOrder ${menuItem.displayOrder}`
        );
      }
    }

    menuItem.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(menuItem, context);

    const updated = await this.menuItemRepository.save(menuItem);

    const action =
      !previousActive && active
        ? AUDIT_ACTIONS.REACTIVATE_MENU_ITEM
        : previousActive && !active
          ? AUDIT_ACTIONS.DEACTIVATE_MENU_ITEM
          : active
            ? AUDIT_ACTIONS.REACTIVATE_MENU_ITEM
            : AUDIT_ACTIONS.DEACTIVATE_MENU_ITEM;

    await this.auditLogService.record({
      action,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU_ITEM,
      recordId: updated.id,
      applicationId: updated.applicationId,
      oldValues,
      newValues: {
        id: updated.id,
        active: updated.active,
      },
    });

    return updated;
  }

  async assignMenuPermission(dto: CreateMenuPermissionDto): Promise<MenuPermissionEntity> {
    await this.findMenuItemById(dto.menu_item_id);

    const permission = await this.permissionRepository.findOne({
      where: {
        id: dto.permission_id,
        active: true,
      },
    });

    if (!permission) {
      throw new NotFoundException('Permiso no encontrado');
    }

    const existing = await this.menuPermissionRepository.findOne({
      where: {
        menuItemId: dto.menu_item_id,
        permissionId: dto.permission_id,
      },
    });

    if (existing?.active) {
      throw new ConflictException('La relación ya existe');
    }

    if (existing && !existing.active) {
      existing.active = true;

      const context = this.auditContextService.getContext();

      this.auditEntityService.applyUpdateAudit(existing, context);

      return this.menuPermissionRepository.save(existing);
    }

    const entity = this.menuPermissionRepository.create({
      menuItemId: dto.menu_item_id,
      permissionId: dto.permission_id,
      applicationId: dto.application_id,
      active: true,
    });

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyCreationAudit(entity, context);

    const saved = await this.menuPermissionRepository.save(entity);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.ASSIGN_MENU_PERMISSION,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU_PERMISSION,
      recordId: saved.id,
      applicationId: saved.applicationId,
      newValues: {
        ...saved,
      },
    });

    return saved;
  }

  async replaceMenuPermissions(
    menuItemId: string,
    dto: UpdateMenuPermissionsDto
  ): Promise<MenuPermissionEntity[]> {
    await this.findMenuItemById(menuItemId);

    const current = await this.menuPermissionRepository.find({
      where: {
        menuItemId,
      },
    });

    for (const item of current) {
      item.active = false;

      const context = this.auditContextService.getContext();

      this.auditEntityService.applyUpdateAudit(item, context);

      await this.menuPermissionRepository.save(item);
    }

    const result: MenuPermissionEntity[] = [];

    for (const permissionId of dto.permission_ids) {
      const relation = await this.assignMenuPermission({
        menu_item_id: menuItemId,
        permission_id: permissionId,
        application_id:
          current[0]?.applicationId ?? (await this.findMenuItemById(menuItemId)).applicationId,
      });

      result.push(relation);
    }

    return result;
  }

  async updateMenuPermissionStatus(id: string, active: boolean): Promise<MenuPermissionEntity> {
    const menuPermission = await this.menuPermissionRepository.findOne({
      where: { id },
    });

    if (!menuPermission) {
      throw new NotFoundException('Menu Permission no encontrado');
    }

    const oldValues = {
      ...menuPermission,
    };

    menuPermission.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(menuPermission, context);

    const updated = await this.menuPermissionRepository.save(menuPermission);

    const action = active
      ? AUDIT_ACTIONS.ASSIGN_MENU_PERMISSION
      : AUDIT_ACTIONS.REMOVE_MENU_PERMISSION;

    await this.auditLogService.record({
      action,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU_PERMISSION,
      recordId: updated.id,
      applicationId: updated.applicationId,
      oldValues,
      newValues: {
        id: updated.id,
        active: updated.active,
      },
    });

    return updated;
  }

  async findMenuItemPermissions(menuItemId: string): Promise<MenuPermissionEntity[]> {
    return this.menuPermissionRepository.find({
      where: {
        menuItemId,
        active: true,
      },
    });
  }
}
