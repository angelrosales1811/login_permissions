import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { RolePermission } from '../roles/entities/role-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { PermissionCache } from './entities/permission-cache.entity';

@Injectable()
export class PermissionCacheService {
  constructor(
    @InjectRepository(PermissionCache)
    private readonly permissionCacheRepository: Repository<PermissionCache>,

    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>
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
}
