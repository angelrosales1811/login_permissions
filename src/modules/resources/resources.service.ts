import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AUDIT_ACTIONS } from '../../common/constants/audit-actions.constant';
import { AUDIT_ENTITIES } from '../../common/constants/audit-entities.constant';
import { AuditContextService } from '../../common/services/audit-context.service';
import { AuditEntityService } from '../../common/services/audit-entity.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { ModuleResource } from '../modules/entities/module-resource.entity';
import { Module } from '../modules/entities/module.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { Resource } from './entities/resource.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,

    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,

    @InjectRepository(ModuleResource)
    private readonly moduleResourceRepository: Repository<ModuleResource>,

    private readonly auditContextService: AuditContextService,

    private readonly auditEntityService: AuditEntityService,

    private readonly auditLogService: AuditLogService
  ) {}

  async create(dto: CreateResourceDto): Promise<Resource> {
    const exists = await this.resourceRepository.findOne({
      where: {
        internal_name: dto.internal_name,
        application_id: dto.application_id,
      },
    });

    if (exists) {
      throw new ConflictException('El recurso ya existe');
    }

    for (const moduleId of dto.module_ids) {
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId },
      });

      if (!module) {
        throw new NotFoundException(`Module ${moduleId} not found`);
      }
    }

    const resource = this.resourceRepository.create({
      internal_name: dto.internal_name,
      external_name: dto.external_name,
      description: dto.description,
      application_id: dto.application_id,
      active: true,
    });

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyCreationAudit(resource, context);

    const savedResource = await this.resourceRepository.save(resource);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.CREATE,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.RESOURCE,
      recordId: savedResource.id,
      applicationId: savedResource.application_id,
      newValues: {
        id: savedResource.id,
        internal_name: savedResource.internal_name,
        external_name: savedResource.external_name,
        application_id: savedResource.application_id,
        active: savedResource.active,
      },
    });

    for (const moduleId of dto.module_ids) {
      const module = await this.moduleRepository.findOne({
        where: {
          id: moduleId,
        },
      });

      if (!module) {
        throw new NotFoundException(`Module ${moduleId} not found`);
      }

      const relation = this.moduleResourceRepository.create({
        module_id: moduleId,
        resource_id: savedResource.id,
        active: true,
      });

      this.auditEntityService.applyCreationAudit(relation, context);

      const savedRelation = await this.moduleResourceRepository.save(relation);

      await this.auditLogService.record({
        action: AUDIT_ACTIONS.CREATE,
        moduleName: 'IAM',
        entityName: AUDIT_ENTITIES.MODULE_RESOURCE,
        recordId: savedResource.id,
        applicationId: savedResource.application_id,
        newValues: {
          module_id: savedRelation.module_id,
          resource_id: savedRelation.resource_id,
          active: savedRelation.active,
        },
      });
    }

    return savedResource;
  }

  async findAll(): Promise<Resource[]> {
    return this.resourceRepository.find({
      order: {
        internal_name: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.resourceRepository.findOne({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Resource ${id} not found`);
    }

    return resource;
  }

  async update(id: string, dto: UpdateResourceDto): Promise<Resource> {
    const resource = await this.findOne(id);

    const oldValues = {
      ...resource,
    };

    resource.internal_name = dto.internal_name ?? resource.internal_name;

    resource.external_name = dto.external_name ?? resource.external_name;

    resource.description = dto.description ?? resource.description;

    resource.application_id = dto.application_id ?? resource.application_id;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(resource, context);

    const updated = await this.resourceRepository.save(resource);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.UPDATE,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.RESOURCE,
      recordId: updated.id,
      applicationId: updated.application_id,
      oldValues,
      newValues: {
        id: updated.id,
        internal_name: updated.internal_name,
        external_name: updated.external_name,
        description: updated.description,
        application_id: updated.application_id,
        active: updated.active,
      },
    });

    return updated;
  }

  async updateStatus(id: string, active: boolean): Promise<Resource> {
    const resource = await this.findOne(id);

    const oldValues = {
      ...resource,
    };

    resource.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(resource, context);

    const updated = await this.resourceRepository.save(resource);

    await this.auditLogService.record({
      action: active ? AUDIT_ACTIONS.ACTIVATE : AUDIT_ACTIONS.DEACTIVATE,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.RESOURCE,
      recordId: updated.id,
      applicationId: updated.application_id,
      oldValues,
      newValues: {
        id: updated.id,
        active: updated.active,
      },
    });

    return updated;
  }
}
