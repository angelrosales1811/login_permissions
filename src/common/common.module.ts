import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLog } from '../modules/audit/entities/audit-log.entity';

import { RequestContextService } from './context/request-context.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { AuditContextService } from './services/audit-context.service';
import { AuditEntityService } from './services/audit-entity.service';
import { AuditLogService } from './services/audit-log.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [
    RequestContextService,
    RequestContextMiddleware,
    AuditContextService,
    AuditEntityService,
    AuditLogService,
  ],
  exports: [RequestContextService, AuditContextService, AuditEntityService, AuditLogService],
})
export class CommonModule {}
