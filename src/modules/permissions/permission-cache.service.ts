import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { RolePermission } from '../roles/entities/role-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { PermissionCache } from './entities/permission-cache.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionCacheService {
  constructor(
    @InjectRepository(PermissionCache)
    private readonly permissionCacheRepository: Repository<PermissionCache>,

    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>
  ) {}

  async invalidateUser(userId: string): Promise<void> {
    await this.permissionCacheRepository.delete({
      user_id: userId,
    });
  }

  async invalidateUsers(userIds: string[]): Promise<void> {
    if (!userIds.length) {
      return;
    }

    await this.permissionCacheRepository
      .createQueryBuilder()
      .delete()
      .where('user_id IN (:...userIds)', { userIds })
      .execute();
  }

  async invalidateByUserRole(userId: string): Promise<void> {
    await this.invalidateUser(userId);
  }

  async invalidateByRole(roleId: string): Promise<void> {
    const userRoles = await this.userRoleRepository.find({
      where: {
        role_id: roleId,
        active: true,
      },
    });

    const userIds = userRoles.map((item) => item.user_id);

    await this.invalidateUsers(userIds);
  }

  async invalidateByPermission(permissionId: string): Promise<void> {
    const relations = await this.rolePermissionRepository.find({
      where: {
        permission_id: permissionId,
      },
    });

    const roleIds = [...new Set(relations.map((r) => r.role_id))];

    for (const roleId of roleIds) {
      await this.invalidateByRole(roleId);
    }
  }

  async generateUserPermissionCache(userId: string): Promise<number> {
    const userRoles = await this.userRoleRepository.find({
      where: {
        user_id: userId,
        active: true,
      },
    });

    if (!userRoles.length) {
      return 0;
    }

    const roleIds = userRoles.map((x) => x.role_id);

    const rolePermissions = await this.rolePermissionRepository.find({
      where: {
        active: true,
      },
    });

    const permissions = rolePermissions.filter((item) => roleIds.includes(item.role_id));

    await this.permissionCacheRepository.delete({
      user_id: userId,
    });

    const cacheRows: Partial<PermissionCache>[] = [];

    for (const item of permissions) {
      const permission = await this.permissionRepository.findOne({
        where: {
          id: item.permission_id,
          active: true,
        },
      });

      if (!permission) {
        continue;
      }

      const exists = cacheRows.some(
        (row) =>
          row.resource_id === item.resource_id &&
          row.permission_code === permission.permission_code &&
          row.application_id === item.application_id
      );

      if (exists) {
        continue;
      }

      cacheRows.push({
        user_id: userId,
        role_id: item.role_id,
        resource_id: item.resource_id,
        application_id: item.application_id,
        permission_id: permission.id,
        permission_code: permission.permission_code,
        calculated_at: new Date(),
        active: true,
      });
    }

    if (cacheRows.length) {
      await this.permissionCacheRepository.save(cacheRows);
    }

    return cacheRows.length;
  }
}
