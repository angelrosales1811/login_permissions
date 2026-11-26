import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { PermissionCacheService } from '../permissions/permission-cache.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { Application } from '../applications/entities/application.entity';
import { ModuleResource } from '../modules/entities/module-resource.entity';
import { Module as ModuleEntity } from '../modules/entities/module.entity';
import { RoleModule } from '../modules/entities/role-module.entity';
import { MenuItemEntity } from '../navigation/entities/menu-item.entity';
import { MenuPermissionEntity } from '../navigation/entities/menu-permission.entity';
import { NavigationModule } from '../navigation/navigation.module';
import { Permission } from '../permissions/entities/permission.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { Resource } from '../resources/entities/resource.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { UserProfile } from './entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProfile,
      UserRole,
      Role,
      RoleModule,
      RolePermission,
      ModuleResource,
      Application,
      ModuleEntity,
      Resource,
      Permission,
      MenuItemEntity,
      MenuPermissionEntity,
    ]),
    PermissionsModule,
    NavigationModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
