import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { PermissionCacheService } from '../permissions/permission-cache.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

import { ModuleResource } from '../modules/entities/module-resource.entity';
import { Module as ModuleEntity } from '../modules/entities/module.entity';
import { RoleModule } from '../modules/entities/role-module.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

import { PermissionMatrixResponseDto } from './dto/permission-matrix-response.dto';

import { Permission } from '../permissions/entities/permission.entity';
import { Resource } from '../resources/entities/resource.entity';

import { UpdateRoleModulesDto } from './dto/update-role-modules.dto';

import { CatalogFilterDto } from '../../common/dto/catalog-filter.dto';
import { AuditContextService } from '../../common/services/audit-context.service';
import { AuditEntityService } from '../../common/services/audit-entity.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

import { AuditLogService } from '../../common/services/audit-log.service';

import { AUDIT_ACTIONS } from '../../common/constants/audit-actions.constant';

import { AUDIT_ENTITIES } from '../../common/constants/audit-entities.constant';
import { AssignRoleModuleDto } from './dto/assign-role-module.dto';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    // @InjectRepository(PermissionCache)
    // private readonly permissionCacheRepository: Repository<PermissionCache>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,

    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,

    @InjectRepository(RoleModule)
    private readonly roleModuleRepository: Repository<RoleModule>,

    private readonly permissionCacheService: PermissionCacheService,

    @InjectRepository(ModuleResource)
    private readonly moduleResourceRepository: Repository<ModuleResource>,

    private readonly auditContextService: AuditContextService,

    private readonly auditEntityService: AuditEntityService,

    private readonly auditLogService: AuditLogService
  ) {}

  async getUserRolesByUserId(userId: string): Promise<string[]> {
    const userProfile = await this.userRoleRepository.findOne({
      where: {
        user_id: userId,
        active: true,
      },
    });

    if (!userProfile) {
      return [];
    }

    return this.getUserRoles(userProfile.id);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: {
        user_id: userId,
        active: true,
      },
    });

    if (!userRoles.length) {
      return [];
    }

    const roleIds = userRoles.map((item) => item.role_id);

    const roles = await this.roleRepository.find({
      where: {
        active: true,
      },
    });

    return roles
      .filter((role) => roleIds.includes(role.id))
      .map((role) => role.internal_name.toUpperCase());
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const exists = await this.roleRepository.findOne({
      where: {
        internal_name: dto.internal_name,
      },
    });

    if (exists) {
      throw new ConflictException('El rol ya existe');
    }

    const role = this.roleRepository.create({
      internal_name: dto.internal_name,
      external_name: dto.external_name,
      description: dto.description,
      active: true,
    });

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyCreationAudit(role, context);

    const saved = await this.roleRepository.save(role);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.CREATE,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.ROLE,

      recordId: saved.id,

      newValues: {
        id: saved.id,
        internal_name: saved.internal_name,
        external_name: saved.external_name,
        description: saved.description,
        active: saved.active,
      },
    });

    return saved;
  }

  async findAll(query?: CatalogFilterDto): Promise<Role[]> {
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

    return this.roleRepository.find({
      where,
      order: {
        internal_name: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    const oldValues = {
      internal_name: role.internal_name,
      external_name: role.external_name,
      description: role.description,
      active: role.active,
    };

    role.internal_name = dto.internal_name ?? role.internal_name;

    role.external_name = dto.external_name ?? role.external_name;

    role.description = dto.description ?? role.description;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(role, context);

    const updated = await this.roleRepository.save(role);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.UPDATE,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.ROLE,

      recordId: updated.id,

      oldValues,

      newValues: {
        internal_name: updated.internal_name,
        external_name: updated.external_name,
        description: updated.description,
        active: updated.active,
      },
    });

    return updated;
  }

  async updateStatus(id: string, active: boolean): Promise<Role> {
    const role = await this.findOne(id);
    const previousActive = role.active;

    const oldValues = {
      active: role.active,
    };

    role.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(role, context);

    const updated = await this.roleRepository.save(role);

    await this.permissionCacheService.rebuildUsersByRole(id);

    const action =
      !previousActive && active
        ? AUDIT_ACTIONS.REACTIVATE
        : previousActive && !active
          ? AUDIT_ACTIONS.DEACTIVATE
          : active
            ? AUDIT_ACTIONS.ACTIVATE
            : AUDIT_ACTIONS.DEACTIVATE;

    await this.auditLogService.record({
      action,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.ROLE,

      recordId: updated.id,

      oldValues,

      newValues: {
        active: updated.active,
      },
    });

    return updated;
  }

  async getRolePermissions(roleId: string, query?: CatalogFilterDto): Promise<RolePermission[]> {
    await this.findOne(roleId);

    const where: {
      role_id: string;
      active?: boolean;
    } = {
      role_id: roleId,
    };

    if (!query?.includeInactive) {
      where.active = query?.active !== undefined ? query.active : true;
    }

    return this.rolePermissionRepository.find({
      where,
    });
  }

  async assignRolePermission(
    roleId: string,
    dto: AssignRolePermissionDto
  ): Promise<RolePermission> {
    await this.findOne(roleId);

    const resource = await this.resourceRepository.findOne({
      where: {
        id: dto.resourceId,
        active: true,
      },
    });

    if (!resource) {
      throw new NotFoundException(`Resource ${dto.resourceId} not found`);
    }

    const permission = await this.permissionRepository.findOne({
      where: {
        id: dto.permissionId,
        active: true,
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission ${dto.permissionId} not found`);
    }

    const existing = await this.rolePermissionRepository.findOne({
      where: {
        role_id: roleId,
        resource_id: dto.resourceId,
      },
    });

    const context = this.auditContextService.getContext();

    if (existing) {
      if (existing.active) {
        return existing;
      }

      existing.permission_id = dto.permissionId;
      existing.application_id = dto.applicationId;
      existing.active = true;

      this.auditEntityService.applyUpdateAudit(existing, context);

      const saved = await this.rolePermissionRepository.save(existing);

      await this.permissionCacheService.rebuildUsersByRole(roleId);

      await this.auditLogService.record({
        action: AUDIT_ACTIONS.PERMISSION_REACTIVATED,
        moduleName: 'IAM',
        entityName: AUDIT_ENTITIES.ROLE_PERMISSION,
        recordId: roleId,
        oldValues: {
          resourceId: dto.resourceId,
          active: false,
        },
        newValues: {
          resourceId: dto.resourceId,
          active: true,
        },
      });

      return saved;
    }

    const relation = this.rolePermissionRepository.create({
      role_id: roleId,
      resource_id: dto.resourceId,
      permission_id: dto.permissionId,
      application_id: dto.applicationId,
      active: true,
    });

    this.auditEntityService.applyCreationAudit(relation, context);

    const saved = await this.rolePermissionRepository.save(relation);

    await this.permissionCacheService.rebuildUsersByRole(roleId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.PERMISSION_ASSIGN,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.ROLE_PERMISSION,
      recordId: roleId,
      oldValues: {},
      newValues: {
        resourceId: dto.resourceId,
        permissionId: dto.permissionId,
        active: true,
      },
    });

    return saved;
  }

  async updateRolePermissionStatus(
    roleId: string,
    resourceId: string,
    active: boolean
  ): Promise<RolePermission> {
    const relation = await this.rolePermissionRepository.findOne({
      where: {
        role_id: roleId,
        resource_id: resourceId,
      },
    });

    if (!relation) {
      throw new NotFoundException('RolePermission relation not found');
    }

    const previousStatus = relation.active;

    relation.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(relation, context);

    const updated = await this.rolePermissionRepository.save(relation);

    await this.permissionCacheService.rebuildUsersByRole(roleId);

    await this.auditLogService.record({
      action: active ? AUDIT_ACTIONS.PERMISSION_REACTIVATED : AUDIT_ACTIONS.PERMISSION_DEACTIVATED,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.ROLE_PERMISSION,

      recordId: roleId,

      oldValues: {
        resourceId,
        active: previousStatus,
      },

      newValues: {
        resourceId,
        active,
      },
    });

    return updated;
  }

  /////////////////////////////////////////

  async updateRolePermissions(roleId: string, dto: UpdateRolePermissionsDto): Promise<void> {
    await this.findOne(roleId);

    if (!dto.permissions.length) {
      throw new ConflictException('La matriz de permisos no puede quedar vacía');
    }

    const oldRelations = await this.rolePermissionRepository.find({
      where: {
        role_id: roleId,
        active: true,
      },
    });

    const oldValues = oldRelations.map((x) => ({
      resource_id: x.resource_id,
      permission_id: x.permission_id,
      application_id: x.application_id,
    }));

    const context = this.auditContextService.getContext();

    for (const item of dto.permissions) {
      const resource = await this.resourceRepository.findOne({
        where: {
          id: item.resourceId,
          active: true,
        },
      });

      if (!resource) {
        throw new NotFoundException(`Resource ${item.resourceId} not found`);
      }

      const permission = await this.permissionRepository.findOne({
        where: {
          id: item.permissionId,
          active: true,
        },
      });

      if (!permission) {
        throw new NotFoundException(`Permission ${item.permissionId} not found`);
      }
    }

    const currentPermissions = await this.rolePermissionRepository.find({
      where: {
        role_id: roleId,
        active: true,
      },
    });

    for (const relation of currentPermissions) {
      relation.active = false;

      this.auditEntityService.applyUpdateAudit(relation, context);

      await this.rolePermissionRepository.save(relation);
    }

    for (const item of dto.permissions) {
      const exists = await this.rolePermissionRepository.findOne({
        where: {
          role_id: roleId,
          resource_id: item.resourceId,
        },
      });

      if (exists) {
        exists.permission_id = item.permissionId;

        exists.application_id = item.applicationId;

        exists.active = true;

        this.auditEntityService.applyUpdateAudit(exists, context);

        await this.rolePermissionRepository.save(exists);

        continue;
      }

      const relation = this.rolePermissionRepository.create({
        role_id: roleId,
        resource_id: item.resourceId,
        permission_id: item.permissionId,
        application_id: item.applicationId,
        active: true,
      });

      this.auditEntityService.applyCreationAudit(relation, context);

      await this.rolePermissionRepository.save(relation);
    }

    await this.permissionCacheService.rebuildUsersByRole(roleId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.PERMISSION_ASSIGN,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.ROLE_PERMISSION,

      recordId: roleId,

      oldValues: {
        permissions: oldValues,
        totalPermissions: oldValues.length,
      },

      newValues: {
        permissions: dto.permissions,
        totalPermissions: dto.permissions.length,
      },
    });
  }

  async getRoleModules(roleId: string, query?: CatalogFilterDto): Promise<RoleModule[]> {
    await this.findOne(roleId);

    const where: {
      role_id: string;
      active?: boolean;
    } = {
      role_id: roleId,
    };

    if (!query?.includeInactive) {
      where.active = query?.active !== undefined ? query.active : true;
    }

    return this.roleModuleRepository.find({
      where,
    });
  }

  async assignRoleModule(roleId: string, dto: AssignRoleModuleDto): Promise<RoleModule> {
    await this.findOne(roleId);

    const module = await this.moduleRepository.findOne({
      where: {
        id: dto.moduleId,
        active: true,
      },
    });

    if (!module) {
      throw new NotFoundException(`Module ${dto.moduleId} not found`);
    }

    const existing = await this.roleModuleRepository.findOne({
      where: {
        role_id: roleId,
        module_id: dto.moduleId,
      },
    });

    const context = this.auditContextService.getContext();

    if (existing) {
      if (existing.active) {
        return existing;
      }

      existing.active = true;

      this.auditEntityService.applyUpdateAudit(existing, context);

      const saved = await this.roleModuleRepository.save(existing);

      await this.permissionCacheService.rebuildUsersByRole(roleId);

      await this.auditLogService.record({
        action: AUDIT_ACTIONS.MODULE_REACTIVATED,
        moduleName: 'IAM',
        entityName: AUDIT_ENTITIES.ROLE_MODULE,
        recordId: roleId,
        oldValues: {
          moduleId: dto.moduleId,
          active: false,
        },
        newValues: {
          moduleId: dto.moduleId,
          active: true,
        },
      });

      return saved;
    }

    const relation = this.roleModuleRepository.create({
      role_id: roleId,
      module_id: dto.moduleId,
      application_id: module.application_id,
      active: true,
    });

    this.auditEntityService.applyCreationAudit(relation, context);

    const saved = await this.roleModuleRepository.save(relation);

    await this.permissionCacheService.rebuildUsersByRole(roleId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.MODULE_ASSIGN,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.ROLE_MODULE,
      recordId: roleId,
      oldValues: {},
      newValues: {
        moduleId: dto.moduleId,
        active: true,
      },
    });

    return saved;
  }

  async updateRoleModuleStatus(
    roleId: string,
    moduleId: string,
    active: boolean
  ): Promise<RoleModule> {
    const relation = await this.roleModuleRepository.findOne({
      where: {
        role_id: roleId,
        module_id: moduleId,
      },
    });

    if (!relation) {
      throw new NotFoundException('RoleModule relation not found');
    }

    const previousStatus = relation.active;

    relation.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(relation, context);

    const updated = await this.roleModuleRepository.save(relation);

    await this.permissionCacheService.rebuildUsersByRole(roleId);

    await this.auditLogService.record({
      action: active ? AUDIT_ACTIONS.MODULE_REACTIVATED : AUDIT_ACTIONS.MODULE_DEACTIVATED,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.ROLE_MODULE,

      recordId: roleId,

      oldValues: {
        moduleId,
        active: previousStatus,
      },

      newValues: {
        moduleId,
        active,
      },
    });

    return updated;
  }

  async updateRoleModules(roleId: string, dto: UpdateRoleModulesDto): Promise<void> {
    await this.findOne(roleId);

    const oldRelations = await this.roleModuleRepository.find({
      where: {
        role_id: roleId,
        active: true,
      },
    });

    const oldValues = oldRelations.map((x) => ({
      module_id: x.module_id,
      application_id: x.application_id,
    }));

    const context = this.auditContextService.getContext();

    for (const moduleId of dto.moduleIds) {
      const module = await this.moduleRepository.findOne({
        where: {
          id: moduleId,
          active: true,
        },
      });

      if (!module) {
        throw new NotFoundException(`Module ${moduleId} not found`);
      }
    }

    const currentModules = await this.roleModuleRepository.find({
      where: {
        role_id: roleId,
        active: true,
      },
    });

    for (const relation of currentModules) {
      relation.active = false;

      this.auditEntityService.applyUpdateAudit(relation, context);

      await this.roleModuleRepository.save(relation);
    }

    for (const moduleId of dto.moduleIds) {
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId },
      });

      const exists = await this.roleModuleRepository.findOne({
        where: {
          role_id: roleId,
          module_id: moduleId,
        },
      });

      if (exists) {
        exists.active = true;

        this.auditEntityService.applyUpdateAudit(exists, context);

        await this.roleModuleRepository.save(exists);

        continue;
      }

      const relation = this.roleModuleRepository.create({
        role_id: roleId,
        module_id: moduleId,
        application_id: module?.application_id,
        active: true,
      });

      this.auditEntityService.applyCreationAudit(relation, context);

      await this.roleModuleRepository.save(relation);
    }

    await this.permissionCacheService.rebuildUsersByRole(roleId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.MODULE_ASSIGN,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.ROLE_MODULE,

      recordId: roleId,

      oldValues: {
        modules: oldValues,
        totalModules: oldValues.length,
      },

      newValues: {
        moduleIds: dto.moduleIds,
        totalModules: dto.moduleIds.length,
      },
    });
  }

  async getPermissionMatrix(): Promise<PermissionMatrixResponseDto[]> {
    const roles = await this.roleRepository.find({
      where: {
        active: true,
      },
    });

    const rolePermissions = await this.rolePermissionRepository.find({
      where: {
        active: true,
      },
    });

    const permissions = await this.permissionRepository.find({
      where: {
        active: true,
      },
    });

    const resources = await this.resourceRepository.find({
      where: {
        active: true,
      },
    });

    const moduleResources = await this.moduleResourceRepository.find({
      where: {
        active: true,
      },
    });

    const modules = await this.moduleRepository.find({
      where: {
        active: true,
      },
    });

    const matrix = new Map<string, PermissionMatrixResponseDto>();

    const roleMap = new Map(roles.map((item) => [item.id, item]));

    const resourceMap = new Map(resources.map((item) => [item.id, item]));

    const permissionMap = new Map(permissions.map((item) => [item.id, item]));

    const moduleMap = new Map(modules.map((item) => [item.id, item]));

    const moduleResourceMap = new Map(moduleResources.map((item) => [item.resource_id, item]));

    for (const relation of rolePermissions) {
      const role = roleMap.get(relation.role_id);

      if (!role) {
        continue;
      }

      const resource = resourceMap.get(relation.resource_id);

      if (!resource) {
        continue;
      }

      const permission = permissionMap.get(relation.permission_id);

      if (!permission) {
        continue;
      }

      const moduleRelation = moduleResourceMap.get(resource.id);

      if (!moduleRelation) {
        continue;
      }

      const module = moduleMap.get(moduleRelation.module_id);

      if (!module) {
        continue;
      }

      const key = `${module.id}-${resource.id}-${role.id}`;

      if (!matrix.has(key)) {
        matrix.set(key, {
          module: module.internal_name.toUpperCase(),

          resource: resource.internal_name.toUpperCase(),

          role: role.internal_name.toUpperCase(),

          permissions: [],
        });
      }

      matrix.get(key)!.permissions.push(permission.permission_code);
    }

    return Array.from(matrix.values());
  }
}
