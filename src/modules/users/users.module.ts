import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { PermissionCacheService } from '../permissions/permission-cache.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { PermissionsModule } from '../permissions/permissions.module';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { UserProfile } from './entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile, UserRole, Role]), PermissionsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    // PermissionCacheService
  ],
  exports: [UsersService],
})
export class UsersModule {}
