import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Resource } from '../resources/entities/resource.entity';
import { ModuleResource } from './entities/module-resource.entity';
import { Module } from './entities/module.entity';

import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

import { AuditContextService } from '../../common/services/audit-context.service';
import { AuditEntityService } from '../../common/services/audit-entity.service';

import { AUDIT_ACTIONS } from '../../common/constants/audit-actions.constant';
import { AUDIT_ENTITIES } from '../../common/constants/audit-entities.constant';
import { AuditLogService } from '../../common/services/audit-log.service';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,

    @InjectRepository(ModuleResource)
    private readonly moduleResourceRepository: Repository<ModuleResource>,

    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,

    private readonly auditContextService: AuditContextService,

    private readonly auditEntityService: AuditEntityService,

    private readonly auditLogService: AuditLogService
  ) {}

  private async validateModuleCanBeDisabled(moduleId: string): Promise<void> {
    const activeRelations = await this.moduleResourceRepository.find({
      where: {
        module_id: moduleId,
        active: true,
      },
    });

    if (!activeRelations.length) {
      return;
    }

    const resourceIds = activeRelations.map((relation) => relation.resource_id);

    const activeResources = await this.resourceRepository
      .createQueryBuilder('resource')
      .where('resource.id IN (:...ids)', {
        ids: resourceIds,
      })
      .andWhere('resource.active = true')
      .getCount();

    if (activeResources > 0) {
      throw new BadRequestException(
        'No es posible desactivar el módulo porque tiene recursos activos asociados'
      );
    }
  }

  async create(dto: CreateModuleDto): Promise<Module> {
    const exists = await this.moduleRepository.findOne({
      where: {
        internal_name: dto.internal_name,
        application_id: dto.application_id,
      },
    });

    if (exists) {
      throw new ConflictException('El módulo ya existe');
    }

    const module = this.moduleRepository.create({
      ...dto,
      active: true,
    });

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyCreationAudit(module, context);

    const saved = await this.moduleRepository.save(module);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.CREATE,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.MODULE,
      recordId: saved.id,
      applicationId: saved.application_id,
      newValues: { ...saved },
    });

    return saved;
  }

  async findAll(): Promise<Module[]> {
    return this.moduleRepository.find({
      where: {
        active: true,
      },
      order: {
        display_order: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Module> {
    const module = await this.moduleRepository.findOne({
      where: { id },
    });

    if (!module) {
      throw new NotFoundException('Módulo no encontrado');
    }

    return module;
  }

  async update(id: string, dto: UpdateModuleDto): Promise<Module> {
    const module = await this.findOne(id);
    const oldValues = {
      ...module,
    };

    module.internal_name = dto.internal_name ?? module.internal_name;

    module.external_name = dto.external_name ?? module.external_name;

    module.route = dto.route ?? module.route;

    module.icon = dto.icon ?? module.icon;

    module.display_order = dto.display_order ?? module.display_order;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(module, context);

    const updated = await this.moduleRepository.save(module);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.UPDATE,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.MODULE,
      recordId: updated.id,
      applicationId: updated.id,
      oldValues,
      newValues: { ...updated },
    });

    return updated;
  }

  async updateStatus(id: string, active: boolean): Promise<Module> {
    const module = await this.findOne(id);
    const previousActive = module.active;

    const oldValues = {
      ...module,
    };

    if (!active) {
      await this.validateModuleCanBeDisabled(id);
    }

    module.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(module, context);

    const updated = await this.moduleRepository.save(module);

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
      entityName: AUDIT_ENTITIES.MODULE,
      recordId: updated.id,
      applicationId: updated.id,
      oldValues,
      newValues: { ...updated },
    });

    return updated;
  }
}
