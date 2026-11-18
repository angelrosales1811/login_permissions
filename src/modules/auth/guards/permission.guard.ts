import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { AUDIT_ACTIONS } from '../../../common/constants/audit-actions.constant';
import { AUDIT_ENTITIES } from '../../../common/constants/audit-entities.constant';
import { RequestContextService } from '../../../common/context/request-context.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { AuthUser } from '../interfaces/auth-user.interface';

interface PermissionMetadata {
  application: string;
  resource: string;
  permissionCode: string;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestContextService: RequestContextService,
    private readonly auditLogService: AuditLogService
  ) {}

  private hasPermissionLevel(userPermissions: string[], requiredPermission: string): boolean {
    if (userPermissions.includes('777')) {
      return true;
    }

    switch (requiredPermission) {
      case '444':
        return userPermissions.some((permission) => ['444', '644', '755'].includes(permission));

      case '644':
        return userPermissions.some((permission) => ['644', '755'].includes(permission));

      case '755':
        return userPermissions.includes('755');

      default:
        return userPermissions.includes(requiredPermission);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.getAllAndOverride<PermissionMetadata>('permission', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (metadata === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & {
        user: AuthUser;
      }
    >();

    const user = request.user;

    const { application, resource, permissionCode } = metadata;

    this.requestContextService.setApplicationId(null);

    this.requestContextService.setModuleName(resource);

    const permissions = user.permissions?.[application];

    if (!permissions) {
      void this.auditLogService.record({
        userId: user.id,
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        moduleName: resource,
        entityName: AUDIT_ENTITIES.USER,
        recordId: user.id,
        newValues: {
          application,
          resource,
          permissionCode,
          reason: 'APPLICATION_DENIED',
          endpoint: request.originalUrl,
          method: request.method,
        },
      });

      throw new ForbiddenException('Application denied');
    }

    const resourcePermissions = permissions[resource];

    if (!resourcePermissions) {
      void this.auditLogService.record({
        userId: user.id,
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        moduleName: resource,
        entityName: AUDIT_ENTITIES.USER,
        recordId: user.id,
        newValues: {
          application,
          resource,
          permissionCode,
          reason: 'RESOURCE_DENIED',
          endpoint: request.originalUrl,
          method: request.method,
        },
      });
      ///////////
      throw new ForbiddenException('Resource denied');
    }

    const hasPermission = this.hasPermissionLevel(resourcePermissions, permissionCode);

    if (!hasPermission) {
      void this.auditLogService.record({
        userId: user.id,
        action: AUDIT_ACTIONS.PERMISSION_DENIED,
        moduleName: resource,
        entityName: AUDIT_ENTITIES.USER,
        recordId: user.id,
        newValues: {
          application,
          resource,
          permissionCode,
          reason: 'PERMISSION_DENIED',

          endpoint: request.originalUrl,

          method: request.method,
        },
      });

      throw new ForbiddenException('Permission denied');
    }

    return true;
  }
}
