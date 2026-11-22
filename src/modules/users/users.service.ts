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
import { PermissionCacheService } from '../permissions/permission-cache.service';
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

    private readonly permissionCacheService: PermissionCacheService,

    private readonly auditContextService: AuditContextService,

    private readonly auditEntityService: AuditEntityService,

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
}
