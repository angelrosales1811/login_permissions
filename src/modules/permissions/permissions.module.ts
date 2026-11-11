import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { Permission } from './entities/permission.entity';

import { UserRole } from '../roles/entities/user-role.entity';
import { PermissionCache } from './entities/permission-cache.entity';
import { PermissionCacheService } from './permission-cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, PermissionCache, RolePermission, UserRole])],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionCacheService],
  exports: [PermissionCacheService],
})
export class PermissionsModule {}
