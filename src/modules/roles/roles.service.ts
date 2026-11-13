import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

//import { PermissionCache } from '../permissions/entities/permission-cache.entity';
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

import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

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
    private readonly moduleResourceRepository: Repository<ModuleResource>
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

    return this.roleRepository.save(
      this.roleRepository.create({
        internal_name: dto.internal_name,
        external_name: dto.external_name,
        description: dto.description,
        active: true,
      })
    );
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
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

    role.internal_name = dto.internal_name ?? role.internal_name;

    role.external_name = dto.external_name ?? role.external_name;

    role.description = dto.description ?? role.description;

    return this.roleRepository.save(role);
  }

  async updateStatus(id: string, active: boolean): Promise<Role> {
    const role = await this.findOne(id);

    role.active = active;

    const updated = await this.roleRepository.save(role);

    await this.permissionCacheService.invalidateByRole(id);

    return updated;
  }

  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    await this.findOne(roleId);

    return this.rolePermissionRepository.find({
      where: {
        role_id: roleId,
        active: true,
      },
    });
  }

  async updateRolePermissions(roleId: string, dto: UpdateRolePermissionsDto): Promise<void> {
    await this.findOne(roleId);

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

    await this.rolePermissionRepository.update(
      {
        role_id: roleId,
      },
      {
        active: false,
      }
    );

    for (const item of dto.permissions) {
      const exists = await this.rolePermissionRepository.findOne({
        where: {
          role_id: roleId,
          resource_id: item.resourceId,
          permission_id: item.permissionId,
        },
      });

      if (exists) {
        exists.active = true;

        await this.rolePermissionRepository.save(exists);

        continue;
      }

      await this.rolePermissionRepository.save({
        role_id: roleId,
        resource_id: item.resourceId,
        permission_id: item.permissionId,
        application_id: item.applicationId,
        active: true,
      });
    }

    await this.permissionCacheService.invalidateByRole(roleId);
  }

  async getRoleModules(roleId: string): Promise<RoleModule[]> {
    await this.findOne(roleId);

    return this.roleModuleRepository.find({
      where: {
        role_id: roleId,
        active: true,
      },
    });
  }

  async updateRoleModules(roleId: string, dto: UpdateRoleModulesDto): Promise<void> {
    await this.findOne(roleId);

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

    await this.roleModuleRepository.update(
      {
        role_id: roleId,
      },
      {
        active: false,
      }
    );

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

        await this.roleModuleRepository.save(exists);

        continue;
      }

      await this.roleModuleRepository.save({
        role_id: roleId,
        module_id: moduleId,
        application_id: module?.application_id,
        active: true,
      });
    }

    await this.permissionCacheService.invalidateByRole(roleId);
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

    for (const relation of rolePermissions) {
      const role = roles.find((x) => x.id === relation.role_id);

      if (!role) {
        continue;
      }

      const resource = resources.find((x) => x.id === relation.resource_id);

      if (!resource) {
        continue;
      }

      const permission = permissions.find((x) => x.id === relation.permission_id);

      if (!permission) {
        continue;
      }

      const moduleRelation = moduleResources.find((x) => x.resource_id === resource.id);

      if (!moduleRelation) {
        continue;
      }

      const module = modules.find((x) => x.id === moduleRelation.module_id);

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
