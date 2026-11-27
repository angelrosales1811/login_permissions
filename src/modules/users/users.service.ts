import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfile } from './entities/user-profile.entity';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AUDIT_ACTIONS } from '../../common/constants/audit-actions.constant';
import { AUDIT_ENTITIES } from '../../common/constants/audit-entities.constant';
import { CatalogFilterDto } from '../../common/dto/catalog-filter.dto';
import { AuditContextService } from '../../common/services/audit-context.service';
import { AuditEntityService } from '../../common/services/audit-entity.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { Application } from '../applications/entities/application.entity';
import { ModuleResource } from '../modules/entities/module-resource.entity';
import { Module } from '../modules/entities/module.entity';
import { RoleModule } from '../modules/entities/role-module.entity';
import { MenuItemEntity } from '../navigation/entities/menu-item.entity';
import { MenuPermissionEntity } from '../navigation/entities/menu-permission.entity';
import { NavigationService } from '../navigation/navigation.service';
import { Permission } from '../permissions/entities/permission.entity';
import { PermissionCacheService } from '../permissions/permission-cache.service';
import { Resource } from '../resources/entities/resource.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,

    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(RoleModule)
    private readonly roleModuleRepository: Repository<RoleModule>,

    @InjectRepository(ModuleResource)
    private readonly moduleResourceRepository: Repository<ModuleResource>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(MenuItemEntity)
    private readonly menuItemRepository: Repository<MenuItemEntity>,

    @InjectRepository(MenuPermissionEntity)
    private readonly menuPermissionRepository: Repository<MenuPermissionEntity>,

    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,

    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,

    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    private readonly permissionCacheService: PermissionCacheService,

    private readonly auditContextService: AuditContextService,

    private readonly auditEntityService: AuditEntityService,

    private readonly navigationService: NavigationService,

    private readonly auditLogService: AuditLogService
  ) {}

  create(createUserDto: CreateUserDto) {
    console.log('createUserDto', createUserDto);
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string): Promise<UserProfile> {
    const user = await this.userProfileRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async getUserRoles(userId: string, query?: CatalogFilterDto): Promise<UserRole[]> {
    const where: {
      user_id: string;
      active?: boolean;
    } = {
      user_id: userId,
    };

    if (!query?.includeInactive) {
      where.active = query?.active !== undefined ? query.active : true;
    }

    return this.userRoleRepository.find({
      where,
    });
  }

  async assignRole(userId: string, dto: AssignUserRoleDto): Promise<UserRole> {
    await this.findOne(userId);

    const role = await this.roleRepository.findOne({
      where: {
        id: dto.roleId,
        active: true,
      },
    });

    if (!role) {
      throw new NotFoundException(`Role ${dto.roleId} not found`);
    }

    const existing = await this.userRoleRepository.findOne({
      where: {
        user_id: userId,
        role_id: dto.roleId,
      },
    });

    const context = this.auditContextService.getContext();

    if (existing) {
      existing.active = true;

      this.auditEntityService.applyUpdateAudit(existing, context);

      const saved = await this.userRoleRepository.save(existing);

      await this.permissionCacheService.rebuildUserPermissionCache(userId);

      await this.auditLogService.record({
        action: AUDIT_ACTIONS.ROLE_REACTIVATED,

        moduleName: 'IAM',

        entityName: AUDIT_ENTITIES.USER_ROLE,

        recordId: userId,

        oldValues: {
          roleId: dto.roleId,
          active: false,
        },

        newValues: {
          roleId: dto.roleId,
          active: true,
        },
      });

      return saved;
    }

    const relation = this.userRoleRepository.create({
      user_id: userId,
      role_id: dto.roleId,
      active: true,
    });

    this.auditEntityService.applyCreationAudit(relation, context);

    const saved = await this.userRoleRepository.save(relation);

    await this.permissionCacheService.rebuildUserPermissionCache(userId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.ROLE_ASSIGN,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.USER_ROLE,

      recordId: userId,

      oldValues: {},

      newValues: {
        roleId: dto.roleId,
        active: true,
      },
    });

    return saved;
  }

  async updateUserRoleStatus(userId: string, roleId: string, active: boolean): Promise<UserRole> {
    const relation = await this.userRoleRepository.findOne({
      where: {
        user_id: userId,
        role_id: roleId,
      },
    });

    if (!relation) {
      throw new NotFoundException(`UserRole relation not found`);
    }

    const previousStatus = relation.active;

    relation.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(relation, context);

    const updated = await this.userRoleRepository.save(relation);
    await this.permissionCacheService.rebuildUserPermissionCache(userId);

    await this.auditLogService.record({
      action: active ? AUDIT_ACTIONS.ROLE_REACTIVATED : AUDIT_ACTIONS.ROLE_DEACTIVATED,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.USER_ROLE,

      recordId: userId,

      oldValues: {
        roleId,
        active: previousStatus,
      },

      newValues: {
        roleId,
        active,
      },
    });

    return updated;
  }

  async updateUserRoles(userId: string, dto: UpdateUserRolesDto): Promise<void> {
    await this.findOne(userId);

    const oldRelations = await this.userRoleRepository.find({
      where: {
        user_id: userId,
        active: true,
      },
    });

    const oldValues = oldRelations.map((x) => ({
      role_id: x.role_id,
    }));

    const context = this.auditContextService.getContext();

    for (const roleId of dto.roleIds) {
      const role = await this.roleRepository.findOne({
        where: {
          id: roleId,
          active: true,
        },
      });

      if (!role) {
        throw new NotFoundException(`Role ${roleId} not found`);
      }
    }

    const existingRoles = await this.userRoleRepository.find({
      where: {
        user_id: userId,
        active: true,
      },
    });

    for (const relation of existingRoles) {
      relation.active = false;

      this.auditEntityService.applyUpdateAudit(relation, context);

      await this.userRoleRepository.save(relation);
    }

    for (const roleId of dto.roleIds) {
      const exists = await this.userRoleRepository.findOne({
        where: {
          user_id: userId,
          role_id: roleId,
        },
      });

      if (exists) {
        exists.active = true;

        this.auditEntityService.applyUpdateAudit(exists, context);

        await this.userRoleRepository.save(exists);

        continue;
      }

      const relation = this.userRoleRepository.create({
        user_id: userId,
        role_id: roleId,
        active: true,
      });

      this.auditEntityService.applyCreationAudit(relation, context);

      await this.userRoleRepository.save(relation);
    }

    await this.permissionCacheService.rebuildUserPermissionCache(userId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.ROLE_ASSIGN,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.USER_ROLE,

      recordId: userId,

      oldValues: {
        roles: oldValues,
        totalRoles: oldValues.length,
      },

      newValues: {
        roleIds: dto.roleIds,
        totalRoles: dto.roleIds.length,
      },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    console.log('updateUserDto', updateUserDto);
    return `This action updates a #${id} user`;
  }

  async getAccessTree(userId: string) {
    const user = await this.findOne(userId);

    const userRoles = await this.userRoleRepository.find({
      where: {
        user_id: userId,
        active: true,
      },
    });

    const roleIds = userRoles.map((relation) => relation.role_id);

    const roles = await this.roleRepository.find({
      where: roleIds.map((id) => ({
        id,
        active: true,
      })),
    });

    const roleModules = await this.roleModuleRepository.find({
      where: roleIds.map((roleId) => ({
        role_id: roleId,
        active: true,
      })),
    });

    const applicationIds = [...new Set(roleModules.map((relation) => relation.application_id))];

    const applications = await this.applicationRepository.find({
      where: applicationIds.map((id) => ({
        id,
        active: true,
      })),
    });

    const moduleIds = [...new Set(roleModules.map((relation) => relation.module_id))];

    const modules = await this.moduleRepository.find({
      where: moduleIds.map((id) => ({
        id,
        active: true,
      })),
    });

    const moduleResources = await this.moduleResourceRepository.find({
      where: moduleIds.map((moduleId) => ({
        module_id: moduleId,
        active: true,
      })),
    });

    const resourceIds = [...new Set(moduleResources.map((relation) => relation.resource_id))];

    const resources = await this.resourceRepository.find({
      where: resourceIds.map((id) => ({
        id,
        active: true,
      })),
    });

    const rolePermissions = await this.rolePermissionRepository.find({
      where: roleIds.map((roleId) => ({
        role_id: roleId,
        active: true,
      })),
    });

    const permissionIds = [
      ...new Set(rolePermissions.map((permission) => permission.permission_id)),
    ];

    const permissions = await this.permissionRepository.find({
      where: permissionIds.map((id) => ({
        id,
        active: true,
      })),
    });

    const menus = await this.navigationService.getMenusByUser(userId);

    const menuItems = await this.menuItemRepository.find({
      where: {
        active: true,
      },
    });

    const menuPermissions = await this.menuPermissionRepository.find({
      where: {
        active: true,
      },
    });

    // =========================
    // LOOKUP MAPS
    // =========================

    const menuItemMap = new Map<string, MenuItemEntity>(menuItems.map((item) => [item.id, item]));

    const moduleResourceMap = new Map<string, string>(
      moduleResources.map((relation) => [relation.module_id, relation.resource_id])
    );

    const resourceMap = new Map<string, Resource>(
      resources.map((resource) => [resource.id, resource])
    );

    const permissionMap = new Map<string, Permission>(
      permissions.map((permission) => [permission.id, permission])
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },

      applications: applications.map((application) => {
        const applicationModules = roleModules.filter(
          (relation) => relation.application_id === application.id
        );

        return {
          id: application.id,
          code: application.code,
          name: application.name,
          description: application.description,

          roles: roles.map((role) => ({
            id: role.id,
            internalName: role.internal_name,
            externalName: role.external_name,
          })),

          modules: applicationModules.map((relation) => {
            const moduleEntity = modules.find((module) => module.id === relation.module_id);

            return {
              id: moduleEntity?.id,
              internalName: moduleEntity?.internal_name,
              externalName: moduleEntity?.external_name,

              resources: moduleResources
                .filter((resourceRelation) => resourceRelation.module_id === relation.module_id)
                .map((resourceRelation) => {
                  const resource = resources.find(
                    (item) => item.id === resourceRelation.resource_id
                  );

                  return {
                    id: resource?.id,
                    internalName: resource?.internal_name,
                    externalName: resource?.external_name,

                    permissions: rolePermissions
                      .filter(
                        (permissionRelation) =>
                          permissionRelation.resource_id === resourceRelation.resource_id
                      )
                      .map((permissionRelation) => {
                        const permission = permissions.find(
                          (item) => item.id === permissionRelation.permission_id
                        );

                        return {
                          id: permission?.id,
                          code: permission?.permission_code,
                          internalName: permission?.internal_name,
                          externalName: permission?.external_name,
                        };
                      }),
                  };
                }),
            };
          }),

          menus: menus.map((menu) => ({
            ...menu,

            items: menu.items.map((item) => {
              const itemPermissions = menuPermissions.filter(
                (permission) => permission.menuItemId === item.id
              );

              return {
                ...item,

                requiredPermissions: itemPermissions.map((itemPermission) => {
                  const permission = permissionMap.get(itemPermission.permissionId);

                  // Obtener el módulo asociado al menu item
                  const menuItemEntity = menuItemMap.get(item.id);

                  // Obtener el recurso asociado al módulo
                  const resourceId = menuItemEntity?.moduleId
                    ? moduleResourceMap.get(menuItemEntity.moduleId)
                    : undefined;

                  const resource = resourceId ? resourceMap.get(resourceId) : undefined;

                  return {
                    permission: {
                      id: permission?.id,
                      code: permission?.permission_code,
                      internalName: permission?.internal_name,
                      externalName: permission?.external_name,
                    },

                    resource: {
                      id: resource?.id,
                      internalName: resource?.internal_name,
                      externalName: resource?.external_name,
                    },
                  };
                }),
              };
            }),
          })),
        };
      }),
    };
  }

  async getMenuTree(userId: string) {
    const user = await this.findOne(userId);

    const menus = await this.navigationService.getMenusByUser(userId);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },
      menus,
    };
  }

  async getSystemTree(userId: string) {
    const accessTree = await this.getAccessTree(userId);

    return {
      generatedAt: new Date().toISOString(),
      ...accessTree,
    };
  }
}
