import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { AuthUser } from '../interfaces/auth-user.interface';

interface PermissionMetadata {
  application: string;
  resource: string;
  permissionCode: string;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

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

    const request = context.switchToHttp().getRequest<{
      user: AuthUser;
    }>();

    const user = request.user;

    const { application, resource, permissionCode } = metadata;

    const permissions = user.permissions?.[application];

    if (!permissions) {
      throw new ForbiddenException('Application denied');
    }

    const resourcePermissions = permissions[resource];

    if (!resourcePermissions) {
      throw new ForbiddenException('Resource denied');
    }

    const hasPermission = this.hasPermissionLevel(resourcePermissions, permissionCode);

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied');
    }

    return true;
  }
}
