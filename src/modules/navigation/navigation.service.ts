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

import { MenuItemEntity } from './entities/menu-item.entity';
import { MenuPermissionEntity } from './entities/menu-permission.entity';

import { MenuItemResponseDto, MenuResponseDto } from './dto/menu-response.dto';

type PermissionRow = {
  permission_id: string;
};

@Injectable()
export class NavigationService {
  constructor(
    // @InjectRepository(MenuEntity)
    // private readonly menuRepository: Repository<MenuEntity>,

    @InjectRepository(MenuItemEntity)
    private readonly menuItemRepository: Repository<MenuItemEntity>,

    @InjectRepository(MenuPermissionEntity)
    private readonly menuPermissionRepository: Repository<MenuPermissionEntity>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    private readonly auditContextService: AuditContextService,
    private readonly auditEntityService: AuditEntityService,
    private readonly auditLogService: AuditLogService
  ) {}

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

  ////////////////////////////////////////////////

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

  async findMenus(active = true): Promise<Menu[]> {
    return this.menuRepository.find({
      where: {
        active,
      },
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

  async deactivateMenu(id: string): Promise<Menu> {
    const menu = await this.findMenuById(id);

    const oldValues = {
      active: menu.active,
    };

    menu.active = false;

    const context = this.auditContextService.getContext();
    if (!context.userId) {
      throw new UnauthorizedException('Audit context not initialized');
    }

    this.auditEntityService.applyUpdateAudit(menu, context);

    const updated = await this.menuRepository.save(menu);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.DEACTIVATE_MENU,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU,
      recordId: updated.id,
      applicationId: updated.applicationId,
      oldValues,
      newValues: {
        active: false,
      },
    });

    return updated;
  }

  async reactivateMenu(id: string): Promise<Menu> {
    const menu = await this.findMenuById(id);

    const oldValues = {
      active: menu.active,
    };

    menu.active = true;

    const context = this.auditContextService.getContext();
    if (!context.userId) {
      throw new UnauthorizedException('Audit context not initialized');
    }

    this.auditEntityService.applyUpdateAudit(menu, context);

    const updated = await this.menuRepository.save(menu);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.REACTIVATE_MENU,
      moduleName: AUDIT_MODULES.NAVIGATION,
      entityName: AUDIT_ENTITIES.MENU,
      recordId: updated.id,
      applicationId: updated.applicationId,
      oldValues,
      newValues: {
        active: true,
      },
    });

    return updated;
  }
}
