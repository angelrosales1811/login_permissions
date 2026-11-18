import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Permission } from './entities/permission.entity';

import { RolePermission } from '../roles/entities/role-permission.entity';

import { CreatePermissionDto } from './dto/create-permission.dto';

import { UpdatePermissionDto } from './dto/update-permission.dto';

import { AuditContextService } from '../../common/services/audit-context.service';

import { AuditEntityService } from '../../common/services/audit-entity.service';

import { PermissionCacheService } from './permission-cache.service';

import { AuditLogService } from '../../common/services/audit-log.service';

import { AUDIT_ACTIONS } from '../../common/constants/audit-actions.constant';

import { AUDIT_ENTITIES } from '../../common/constants/audit-entities.constant';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    private readonly permissionCacheService: PermissionCacheService,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly auditContextService: AuditContextService,

    private readonly auditEntityService: AuditEntityService,

    private readonly auditLogService: AuditLogService
  ) {}

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const exists = await this.permissionRepository.findOne({
      where: {
        internal_name: dto.internal_name,
      },
    });

    if (exists) {
      throw new ConflictException('El permiso ya existe');
    }

    const codeExists = await this.permissionRepository.findOne({
      where: {
        permission_code: dto.permission_code.trim().toUpperCase(),
      },
    });

    if (codeExists) {
      throw new ConflictException('El código de permiso ya existe');
    }

    const permission = this.permissionRepository.create({
      internal_name: dto.internal_name.trim().toUpperCase(),

      external_name: dto.external_name,

      permission_code: dto.permission_code.trim().toUpperCase(),

      description: dto.description,

      active: true,
    });

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyCreationAudit(permission, context);

    const saved = await this.permissionRepository.save(permission);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.CREATE,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.PERMISSION,

      recordId: saved.id,

      newValues: {
        id: saved.id,
        internal_name: saved.internal_name,
        external_name: saved.external_name,
        permission_code: saved.permission_code,
        description: saved.description,
        active: saved.active,
      },
    });

    return saved;
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: {
        active: true,
      },
      order: {
        internal_name: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission ${id} not found`);
    }

    return permission;
  }

  private async validatePermissionCodeChange(permissionId: string): Promise<void> {
    const count = await this.rolePermissionRepository.count({
      where: {
        permission_id: permissionId,
        active: true,
      },
    });

    if (count > 0) {
      throw new BadRequestException(
        'No es posible modificar permission_code porque ya está asignado a roles'
      );
    }
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);

    const oldValues = {
      internal_name: permission.internal_name,

      external_name: permission.external_name,

      permission_code: permission.permission_code,

      description: permission.description,

      active: permission.active,
    };

    if (dto.permission_code && dto.permission_code !== permission.permission_code) {
      await this.validatePermissionCodeChange(id);
    }

    permission.internal_name = dto.internal_name ?? permission.internal_name;

    permission.external_name = dto.external_name ?? permission.external_name;

    permission.description = dto.description ?? permission.description;

    permission.permission_code = dto.permission_code
      ? dto.permission_code.trim().toUpperCase()
      : permission.permission_code;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(permission, context);

    const updated = await this.permissionRepository.save(permission);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.UPDATE,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.PERMISSION,

      recordId: updated.id,

      oldValues,

      newValues: {
        internal_name: updated.internal_name,

        external_name: updated.external_name,

        permission_code: updated.permission_code,

        description: updated.description,

        active: updated.active,
      },
    });

    return updated;
  }

  async updateStatus(id: string, active: boolean): Promise<Permission> {
    const permission = await this.findOne(id);
    const previousActive = permission.active;

    const oldValues = {
      active: permission.active,
    };

    permission.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(permission, context);

    const updated = await this.permissionRepository.save(permission);

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

      entityName: AUDIT_ENTITIES.PERMISSION,

      recordId: updated.id,

      oldValues,

      newValues: {
        active: updated.active,
      },
    });

    return updated;
  }

  async cacheHealth() {
    return this.permissionCacheService.getCacheHealth();
  }

  async rebuildUserCache(userId: string) {
    const rebuilt = await this.permissionCacheService.repairUserCache(userId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.INITIAL_CACHE_GENERATED,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.PERMISSION_CACHE,

      recordId: userId,

      newValues: {
        rebuiltRecords: rebuilt,
      },
    });

    return {
      userId,
      rebuilt,
    };
  }

  async rebuildAllCaches() {
    const result = await this.permissionCacheService.rebuildAllCaches();

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.INITIAL_CACHE_GENERATED,

      moduleName: 'IAM',

      entityName: AUDIT_ENTITIES.PERMISSION_CACHE,

      newValues: result,
    });

    return result;
  }
}
