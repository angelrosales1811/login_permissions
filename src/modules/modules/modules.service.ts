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

import { CatalogFilterDto } from '../../common/dto/catalog-filter.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

import { AuditContextService } from '../../common/services/audit-context.service';
import { AuditEntityService } from '../../common/services/audit-entity.service';

import { AUDIT_ACTIONS } from '../../common/constants/audit-actions.constant';
import { AUDIT_ENTITIES } from '../../common/constants/audit-entities.constant';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AssignModuleResourceDto } from './dto/assign-module-resource.dto';
import { UpdateModuleResourcesDto } from './dto/update-module-resources.dto';

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

  async findAll(query?: CatalogFilterDto): Promise<Module[]> {
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

    return this.moduleRepository.find({
      where,
      order: {
        internal_name: 'ASC',
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

  async getModuleResources(moduleId: string, query?: CatalogFilterDto): Promise<ModuleResource[]> {
    await this.findOne(moduleId);

    const where: {
      module_id: string;
      active?: boolean;
    } = {
      module_id: moduleId,
    };

    if (!query?.includeInactive) {
      where.active = query?.active !== undefined ? query.active : true;
    }

    return this.moduleResourceRepository.find({
      where,
    });
  }

  async assignModuleResource(
    moduleId: string,
    dto: AssignModuleResourceDto
  ): Promise<ModuleResource> {
    await this.findOne(moduleId);

    const resource = await this.resourceRepository.findOne({
      where: {
        id: dto.resourceId,
        active: true,
      },
    });

    if (!resource) {
      throw new NotFoundException(`Resource ${dto.resourceId} not found`);
    }

    const existing = await this.moduleResourceRepository.findOne({
      where: {
        module_id: moduleId,
        resource_id: dto.resourceId,
      },
    });

    const context = this.auditContextService.getContext();

    if (existing) {
      if (existing.active) {
        return existing;
      }

      existing.active = true;

      this.auditEntityService.applyUpdateAudit(existing, context);

      const saved = await this.moduleResourceRepository.save(existing);

      await this.auditLogService.record({
        action: AUDIT_ACTIONS.REACTIVATE,
        moduleName: 'IAM',
        entityName: AUDIT_ENTITIES.MODULE_RESOURCE,
        recordId: saved.id,
        oldValues: {
          moduleId,
          resourceId: dto.resourceId,
          active: false,
        },
        newValues: {
          moduleId,
          resourceId: dto.resourceId,
          active: true,
        },
      });

      return saved;
    }

    const relation = this.moduleResourceRepository.create({
      module_id: moduleId,
      resource_id: dto.resourceId,
      active: true,
    });

    this.auditEntityService.applyCreationAudit(relation, context);

    const saved = await this.moduleResourceRepository.save(relation);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.CREATE,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.MODULE_RESOURCE,
      recordId: saved.id,
      oldValues: {},
      newValues: {
        moduleId,
        resourceId: dto.resourceId,
        active: true,
      },
    });

    return saved;
  }

  async updateModuleResourceStatus(
    moduleId: string,
    resourceId: string,
    active: boolean
  ): Promise<ModuleResource> {
    const relation = await this.moduleResourceRepository.findOne({
      where: {
        module_id: moduleId,
        resource_id: resourceId,
      },
    });

    if (!relation) {
      throw new NotFoundException('ModuleResource relation not found');
    }

    const previousStatus = relation.active;

    relation.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(relation, context);

    const updated = await this.moduleResourceRepository.save(relation);

    await this.auditLogService.record({
      action: active ? AUDIT_ACTIONS.REACTIVATE : AUDIT_ACTIONS.DEACTIVATE,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.MODULE_RESOURCE,
      recordId: updated.id,
      oldValues: {
        moduleId,
        resourceId,
        active: previousStatus,
      },
      newValues: {
        moduleId,
        resourceId,
        active,
      },
    });

    return updated;
  }

  async updateModuleResources(moduleId: string, dto: UpdateModuleResourcesDto): Promise<void> {
    await this.findOne(moduleId);

    const oldRelations = await this.moduleResourceRepository.find({
      where: {
        module_id: moduleId,
        active: true,
      },
    });

    const oldValues = oldRelations.map((relation) => ({
      resource_id: relation.resource_id,
    }));

    const context = this.auditContextService.getContext();

    for (const resourceId of dto.resourceIds) {
      const resource = await this.resourceRepository.findOne({
        where: {
          id: resourceId,
          active: true,
        },
      });

      if (!resource) {
        throw new NotFoundException(`Resource ${resourceId} not found`);
      }
    }

    const currentRelations = await this.moduleResourceRepository.find({
      where: {
        module_id: moduleId,
        active: true,
      },
    });

    for (const relation of currentRelations) {
      relation.active = false;

      this.auditEntityService.applyUpdateAudit(relation, context);

      await this.moduleResourceRepository.save(relation);
    }

    for (const resourceId of dto.resourceIds) {
      const existing = await this.moduleResourceRepository.findOne({
        where: {
          module_id: moduleId,
          resource_id: resourceId,
        },
      });

      if (existing) {
        existing.active = true;

        this.auditEntityService.applyUpdateAudit(existing, context);

        await this.moduleResourceRepository.save(existing);

        continue;
      }

      const relation = this.moduleResourceRepository.create({
        module_id: moduleId,
        resource_id: resourceId,
        active: true,
      });

      this.auditEntityService.applyCreationAudit(relation, context);

      await this.moduleResourceRepository.save(relation);
    }

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.UPDATE,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.MODULE_RESOURCE,
      recordId: moduleId,
      oldValues: {
        resources: oldValues,
        totalResources: oldValues.length,
      },
      newValues: {
        resourceIds: dto.resourceIds,
        totalResources: dto.resourceIds.length,
      },
    });
  }
}
