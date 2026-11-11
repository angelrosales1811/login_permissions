import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Permission } from '../permissions/entities/permission.entity';
//import { PermissionCacheService } from '../permissions/permission-cache.service';
import { Module as ModuleEntity } from '../modules/entities/module.entity';
import { RoleModule } from '../modules/entities/role-module.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { Resource } from '../resources/entities/resource.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      UserRole,
      RolePermission,
      Permission,
      Resource,
      ModuleEntity,
      RoleModule,
    ]),
    PermissionsModule,
  ],
  controllers: [RolesController],
  providers: [
    RolesService,
    // PermissionCacheService
  ],
  exports: [RolesService],
})
export class RolesModule {}
