import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Application } from './entities/application.entity';

import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

import { AUDIT_ACTIONS } from '../../common/constants/audit-actions.constant';
import { AUDIT_ENTITIES } from '../../common/constants/audit-entities.constant';
import { AuditContextService } from '../../common/services/audit-context.service';
import { AuditEntityService } from '../../common/services/audit-entity.service';
import { AuditLogService } from '../../common/services/audit-log.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly auditContextService: AuditContextService,
    private readonly auditEntityService: AuditEntityService,
    private readonly auditLogService: AuditLogService
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

    const saved = await this.applicationRepository.save(application);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.CREATE,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.APPLICATION,
      recordId: saved.id,
      applicationId: saved.id,
      newValues: {
        id: saved.id,
        code: saved.code,
        name: saved.name,
        description: saved.description,
        icon: saved.icon,
        route: saved.route,
        active: saved.active,
      },
    });

    return saved;
  }

  async findAll(): Promise<Application[]> {
    return this.applicationRepository.find({
      where: {
        active: true,
      },
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
    const oldValues = {
      code: application.code,
      name: application.name,
      description: application.description,
      icon: application.icon,
      route: application.route,
      active: application.active,
    };

    application.code = dto.code ?? application.code;

    application.name = dto.name ?? application.name;

    application.description = dto.description ?? application.description;

    application.icon = dto.icon ?? application.icon;

    application.route = dto.route ?? application.route;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(application, context);

    const updated = await this.applicationRepository.save(application);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.UPDATE,
      moduleName: 'IAM',
      entityName: AUDIT_ENTITIES.APPLICATION,
      recordId: updated.id,
      applicationId: updated.id,
      oldValues,
      newValues: {
        code: updated.code,
        name: updated.name,
        description: updated.description,
        icon: updated.icon,
        route: updated.route,
        active: updated.active,
      },
    });

    return updated;
  }

  async updateStatus(id: string, active: boolean): Promise<Application> {
    const application = await this.findOne(id);
    const previousActive = application.active;

    const oldValues = {
      active: application.active,
    };
    application.active = active;

    const context = this.auditContextService.getContext();

    this.auditEntityService.applyUpdateAudit(application, context);

    const updated = await this.applicationRepository.save(application);

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
      entityName: AUDIT_ENTITIES.APPLICATION,
      recordId: updated.id,
      applicationId: updated.id,
      oldValues,
      newValues: {
        active: updated.active,
      },
    });

    return updated;
  }
}
