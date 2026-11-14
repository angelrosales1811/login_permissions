import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditContextService } from '../../common/services/audit-context.service';
import { AuditEntityService } from '../../common/services/audit-entity.service';
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

    private readonly auditEntityService: AuditEntityService
  ) {}

  // private async validateCanDisable(resourceId: string): Promise<void> {
  //   const count = await this.dataSource
  //     .createQueryBuilder()
  //     .from('role_permissions', 'rp')
  //     .where('rp.resource_id = :resourceId', { resourceId })
  //     .andWhere('rp.active = true')
  //     .getCount();

  //   if (count > 0) {
  //     throw new BadRequestException('No es posible desactivar un recurso con permisos asignados');
  //   }
  // }

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

    await this.resourceRepository.save(resource);
    for (const moduleId of dto.module_ids) {
      const module = await this.moduleRepository.findOne({
        where: {
          id: moduleId,
        },
      });

      if (!module) {
        throw new NotFoundException(`Module ${moduleId} not found`);
      }

      await this.moduleResourceRepository.save({
        module_id: moduleId,
        resource_id: resource.id,
        active: true,
      });
    }

    return resource;
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

    resource.internal_name = dto.internal_name ?? resource.internal_name;

    resource.external_name = dto.external_name ?? resource.external_name;

    resource.description = dto.description ?? resource.description;

    resource.application_id = dto.application_id ?? resource.application_id;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(resource, context);

    return this.resourceRepository.save(resource);
  }

  async updateStatus(id: string, active: boolean): Promise<Resource> {
    const resource = await this.findOne(id);

    resource.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(resource, context);

    return this.resourceRepository.save(resource);
  }
}
