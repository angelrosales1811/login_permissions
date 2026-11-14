import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Application } from './entities/application.entity';

import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

import { AuditContextService } from '../../common/services/audit-context.service';
import { AuditEntityService } from '../../common/services/audit-entity.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,

    private readonly auditContextService: AuditContextService,

    private readonly auditEntityService: AuditEntityService
  ) {}

  async create(dto: CreateApplicationDto): Promise<Application> {
    const exists = await this.applicationRepository.findOne({
      where: {
        code: dto.code.trim().toUpperCase(),
      },
    });

    if (exists) {
      throw new ConflictException('Ya existe una aplicación con ese código');
    }

    const application = this.applicationRepository.create({
      ...dto,
      active: true,
    });

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyCreationAudit(application, context);

    return this.applicationRepository.save(application);
  }

  async findAll(): Promise<Application[]> {
    return this.applicationRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    return application;
  }

  async update(id: string, dto: UpdateApplicationDto): Promise<Application> {
    const application = await this.findOne(id);

    application.code = dto.code ?? application.code;

    application.name = dto.name ?? application.name;

    application.description = dto.description ?? application.description;

    application.icon = dto.icon ?? application.icon;

    application.route = dto.route ?? application.route;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(application, context);

    return this.applicationRepository.save(application);
  }

  async updateStatus(id: string, active: boolean): Promise<Application> {
    const application = await this.findOne(id);

    application.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(application, context);

    return this.applicationRepository.save(application);
  }
}
