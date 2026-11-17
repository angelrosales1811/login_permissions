import { Injectable } from '@nestjs/common';

import { RequestContextService } from '../context/request-context.service';
import { AuditContext } from '../interfaces/audit-context.interface';

@Injectable()
export class AuditContextService {
  constructor(private readonly requestContextService: RequestContextService) {}

  getContext(): AuditContext {
    return {
      userId: this.requestContextService.getUserId(),

      ip: this.requestContextService.getIp(),

      applicationId: this.requestContextService.getApplicationId(),

      now: new Date(),
    };
  }
}
