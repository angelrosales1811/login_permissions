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

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,

    @InjectRepository(ModuleResource)
    private readonly moduleResourceRepository: Repository<ModuleResource>,

    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>
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

    return this.moduleRepository.save(module);
  }

  async findAll(): Promise<Module[]> {
    return this.moduleRepository.find({
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

    module.internal_name = dto.internal_name ?? module.internal_name;

    module.external_name = dto.external_name ?? module.external_name;

    module.route = dto.route ?? module.route;

    module.icon = dto.icon ?? module.icon;

    module.display_order = dto.display_order ?? module.display_order;
    return this.moduleRepository.save(module);
  }

  async updateStatus(id: string, active: boolean): Promise<Module> {
    const module = await this.findOne(id);

    if (!active) {
      await this.validateModuleCanBeDisabled(id);
    }

    module.active = active;

    return this.moduleRepository.save(module);
  }
}
