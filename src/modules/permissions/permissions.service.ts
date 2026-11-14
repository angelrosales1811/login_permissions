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

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly auditContextService: AuditContextService,

    private readonly auditEntityService: AuditEntityService
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

    return this.permissionRepository.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
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

    return this.permissionRepository.save(permission);
  }

  async updateStatus(id: string, active: boolean): Promise<Permission> {
    const permission = await this.findOne(id);

    permission.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(permission, context);

    return this.permissionRepository.save(permission);
  }
}
