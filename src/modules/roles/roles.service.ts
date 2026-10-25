import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { PermissionCache } from '../permissions/entities/permission-cache.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(PermissionCache)
    private readonly permissionCacheRepository: Repository<PermissionCache>
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

    return roles.filter((role) => roleIds.includes(role.id)).map((role) => role.internal_name);
  }

  create(createRoleDto: unknown) {
    console.log(createRoleDto);
    return {
      message: 'Pendiente implementación',
    };
  }

  findAll() {
    return [];
  }

  findOne(id: number) {
    return {
      id,
      message: 'Pendiente implementación',
    };
  }

  update(id: number, updateRoleDto: unknown) {
    console.log(updateRoleDto);
    return {
      id,
      message: 'Pendiente implementación',
    };
  }

  remove(id: number) {
    return {
      id,
      message: 'Pendiente implementación',
    };
  }
}
