import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { JwtModule } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { Application } from '../applications/entities/application.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Resource } from '../resources/entities/resource.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';

import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { RolesModule } from '../roles/roles.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserSession } from './entities/user-session.entity';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

import { PermissionCache } from '../permissions/entities/permission-cache.entity';

import { NavigationModule } from '../navigation/navigation.module';
import { PermissionCacheService } from '../permissions/permission-cache.service';
import { UserProfile } from '../users/entities/user-profile.entity';
import { PermissionsGuard } from './guards/permission.guard';

@Module({
  imports: [
    PassportModule,
    // SupabaseModule,
    RolesModule,
    TypeOrmModule.forFeature([
      UserSession,
      RefreshToken,
      AuditLog,
      UserRole,
      Role,
      RolePermission,
      Permission,
      Resource,
      Application,
      PermissionCache,
      UserProfile,
    ]),
    NavigationModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),

        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, RolesGuard, PermissionsGuard, JwtStrategy, PermissionCacheService],

  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
