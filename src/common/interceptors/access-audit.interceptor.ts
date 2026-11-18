import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

import { Request } from 'express';

import { Observable, tap } from 'rxjs';

import { AUDIT_ACTIONS } from '../constants/audit-actions.constant';

import { UserAccessLogService } from '../../modules/audit/user-access-log.service';

@Injectable()
export class AccessAuditInterceptor implements NestInterceptor {
  constructor(private readonly accessLogService: UserAccessLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const endpoint: string = request.originalUrl;
    const moduleName = endpoint.includes('/auth')
      ? 'AUTH'
      : endpoint.includes('/roles')
        ? 'ROLES'
        : endpoint.includes('/permissions')
          ? 'PERMISSIONS'
          : endpoint.includes('/resources')
            ? 'RESOURCES'
            : endpoint.includes('/modules')
              ? 'MODULES'
              : endpoint.includes('/applications')
                ? 'APPLICATIONS'
                : endpoint.includes('/users')
                  ? 'USERS'
                  : endpoint.includes('/audit')
                    ? 'AUDIT'
                    : endpoint.includes('/navigation')
                      ? 'NAVIGATION'
                      : 'UNKNOWN';

    const applicationCode = 'IAM';

    return next.handle().pipe(
      tap(() => {
        console.log('[ACCESS_AUDIT]', {
          endpoint,
          moduleName,
          applicationCode,
        });

        void this.accessLogService.register({
          endpoint,
          method: request.method,
          action: AUDIT_ACTIONS.ACCESS,
          moduleName,
          applicationCode,
          userAgent:
            typeof request.headers['user-agent'] === 'string'
              ? request.headers['user-agent']
              : undefined,
        });
      })
    );
  }
}
