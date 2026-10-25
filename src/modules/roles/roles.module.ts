import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionCache } from '../permissions/entities/permission-cache.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, UserRole, Permission, RolePermission, PermissionCache]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
