import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export const Permissions = (application: string, resource: string, permissionCode: string) =>
  SetMetadata(PERMISSION_KEY, {
    application,
    resource,
    permissionCode,
  });
