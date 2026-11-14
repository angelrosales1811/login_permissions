import { Global, Module } from '@nestjs/common';

import { RequestContextService } from './context/request-context.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { AuditContextService } from './services/audit-context.service';
import { AuditEntityService } from './services/audit-entity.service';

@Global()
@Module({
  providers: [
    RequestContextService,
    RequestContextMiddleware,
    AuditContextService,
    AuditEntityService,
  ],
  exports: [RequestContextService, AuditContextService, AuditEntityService],
})
export class CommonModule {}
