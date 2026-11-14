import { Injectable } from '@nestjs/common';

import { AuditContext } from '../interfaces/audit-context.interface';
import { AuditableEntity } from '../interfaces/auditable-entity.interface';

@Injectable()
export class AuditEntityService {
  applyCreationAudit<T extends AuditableEntity>(entity: T, context: AuditContext): T {
    entity.created_by = context.userId;

    entity.created_at = context.now;

    entity.ip_creation = context.ip;

    return entity;
  }

  applyUpdateAudit<T extends AuditableEntity>(entity: T, context: AuditContext): T {
    entity.updated_by = context.userId;

    entity.updated_at = context.now;

    entity.ip_update = context.ip;

    return entity;
  }
}
