import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';
import { AuditLogEvent } from '../interfaces/audit-log-event.interface';
import { AuditContextService } from './audit-context.service';

@Injectable()
export class AuditLogService {
  constructor(
    private readonly auditContextService: AuditContextService,

    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>
  ) {}

  async record(event: AuditLogEvent): Promise<void> {
    try {
      const context = this.auditContextService.getContext();

      const log = this.auditRepository.create({
        userId: event.userId ?? context.userId ?? undefined,

        moduleName: event.moduleName,
        entityName: event.entityName,
        recordId: event.recordId,
        action: event.action,
        oldValues: event.oldValues,
        newValues: event.newValues,
        ip: context.ip ?? undefined,
        applicationId: event.applicationId,
      });

      await this.auditRepository.save(log);
    } catch (error) {
      console.error('[AUDIT_LOG_ERROR]', error);
    }
  }
}
