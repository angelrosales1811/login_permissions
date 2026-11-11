import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfile } from './entities/user-profile.entity';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionCacheService } from '../permissions/permission-cache.service';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../roles/entities/user-role.entity';
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

    private readonly permissionCacheService: PermissionCacheService
  ) {}

  create(createUserDto: CreateUserDto) {
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

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.userRoleRepository.find({
      where: {
        user_id: userId,
        active: true,
      },
    });
  }

  async updateUserRoles(userId: string, dto: UpdateUserRolesDto): Promise<void> {
    await this.findOne(userId);

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

    await this.userRoleRepository.update(
      {
        user_id: userId,
      },
      {
        active: false,
      }
    );

    for (const roleId of dto.roleIds) {
      const exists = await this.userRoleRepository.findOne({
        where: {
          user_id: userId,
          role_id: roleId,
        },
      });

      if (exists) {
        exists.active = true;

        await this.userRoleRepository.save(exists);

        continue;
      }

      await this.userRoleRepository.save({
        user_id: userId,
        role_id: roleId,
        active: true,
      });
    }

    await this.permissionCacheService.invalidateUser(userId);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }
}
