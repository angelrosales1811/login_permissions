import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import dayjs from 'dayjs';

import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { Repository } from 'typeorm';

import { Application } from '../applications/entities/application.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { PermissionCache } from '../permissions/entities/permission-cache.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Resource } from '../resources/entities/resource.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserSession } from './entities/user-session.entity';

import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { hashToken } from './utils/hash-token.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,

    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,

    @InjectRepository(PermissionCache)
    private readonly permissionCacheRepository: Repository<PermissionCache>,

    @InjectRepository(RefreshToken)
    private readonly refreshRepository: Repository<RefreshToken>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>
  ) {}

  private async loadPermissionCache(
    userId: string
  ): Promise<Record<string, Record<string, string[]>> | null> {
    const rows = await this.permissionCacheRepository.find({
      where: {
        user_id: userId,
        active: true,
      },
    });

    if (!rows.length) {
      return null;
    }

    const resources = await this.resourceRepository.find();

    const applications = await this.applicationRepository.find();

    const result: Record<string, Record<string, string[]>> = {};

    for (const row of rows) {
      const application = applications.find((a) => a.id === row.application_id);

      const resource = resources.find((r) => r.id === row.resource_id);

      if (!application || !resource) {
        continue;
      }

      const appCode = application.code;

      const resourceCode = resource.internal_name;

      if (!result[appCode]) {
        result[appCode] = {};
      }

      if (!result[appCode][resourceCode]) {
        result[appCode][resourceCode] = [];
      }

      result[appCode][resourceCode].push(row.permission_code);
    }

    return result;
  }

  private async savePermissionCache(
    userId: string,
    rolePermissions: RolePermission[]
  ): Promise<void> {
    await this.permissionCacheRepository.delete({
      user_id: userId,
    });

    const cacheRows: Partial<PermissionCache>[] = [];

    for (const item of rolePermissions) {
      const permission = await this.permissionRepository.findOne({
        where: {
          id: item.permission_id,
        },
      });

      if (!permission) {
        continue;
      }

      cacheRows.push({
        user_id: userId,
        role_id: item.role_id,
        resource_id: item.resource_id,
        application_id: item.application_id,
        permission_code: permission.permission_code,
        calculated_at: new Date(),
        active: true,
      });
    }

    if (cacheRows.length) {
      await this.permissionCacheRepository.save(cacheRows);
    }
  }

  private async getUserPermissions(
    userId: string
  ): Promise<Record<string, Record<string, string[]>>> {
    const cache = await this.loadPermissionCache(userId);

    if (cache) {
      console.log('RBAC CACHE HIT');

      return cache;
    }
    const userRoles = await this.userRoleRepository.find({
      where: {
        user_id: userId,
        active: true,
      },
    });

    if (!userRoles.length) {
      return {};
    }

    const roleIds = userRoles.map((role) => role.role_id);

    const rolePermissions = await this.rolePermissionRepository.find({
      where: {
        active: true,
      },
    });

    const filteredPermissions = rolePermissions.filter((rp) => roleIds.includes(rp.role_id));

    await this.savePermissionCache(userId, filteredPermissions);

    const result: Record<string, Record<string, string[]>> = {};

    for (const item of filteredPermissions) {
      const permission = await this.permissionRepository.findOne({
        where: {
          id: item.permission_id,
          active: true,
        },
      });

      if (!permission) {
        continue;
      }

      const resource = await this.resourceRepository.findOne({
        where: {
          id: item.resource_id,
          active: true,
        },
      });

      if (!resource) {
        continue;
      }

      const application = await this.applicationRepository.findOne({
        where: {
          id: item.application_id,
          active: true,
        },
      });

      if (!application) {
        continue;
      }

      const applicationKey = application.code;

      const resourceKey = resource.internal_name;

      const action = permission.permission_code;

      if (!result[applicationKey]) {
        result[applicationKey] = {};
      }

      if (!result[applicationKey][resourceKey]) {
        result[applicationKey][resourceKey] = [];
      }

      if (!result[applicationKey][resourceKey].includes(action)) {
        result[applicationKey][resourceKey].push(action);
      }
    }

    return result;
  }

  async invalidatePermissionCache(userId: string): Promise<void> {
    await this.permissionCacheRepository.delete({
      user_id: userId,
    });
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    if (email !== 'admin@crm.com' || password !== '123456') {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const permissions = await this.getUserPermissions('abc97121-c050-4bbe-a6e1-b39ccb68da0b');

    const payload = {
      sub: 'abc97121-c050-4bbe-a6e1-b39ccb68da0b',
      uid: 'USR000001',
      email,
      permissions,
    };

    const session = await this.sessionRepository.save({
      user_id: payload.sub,
      login_at: new Date(),
      active: true,
    });

    const accessPayload = {
      ...payload,
      permissions,
      sessionId: session.id,
    };

    const familyId = crypto.randomUUID();
    const accessToken = await this.jwtService.signAsync(accessPayload);

    const refreshToken = await this.generateRefreshToken(
      payload.sub,
      payload.uid,
      payload.email,
      session.id,
      familyId
    );
    const refreshTokenHash = hashToken(refreshToken);

    await this.refreshRepository.save({
      user_id: payload.sub,
      token_hash: refreshTokenHash,

      session_id: session.id,

      token_family: familyId,

      expires_at: dayjs().add(30, 'day').toDate(),

      revoked: false,

      created_at: new Date(),
    });

    await this.auditRepository.save({
      user_id: payload.sub,
      module_name: 'AUTH',
      entity_name: 'LOGIN',
      action: 'LOGIN',
      created_at: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        uid: payload.uid,
        email,
      },
    };
  }

  private async generateRefreshToken(
    userId: string,
    uid: string,
    email: string,
    sessionId: string,
    familyId: string
  ) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        uid,
        email,
        sessionId,
        familyId,
        type: 'refresh',
      },
      {
        secret: this.configService.getOrThrow('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.getOrThrow('REFRESH_TOKEN_EXPIRES_IN'),
      }
    );
  }

  async refresh(dto: RefreshTokenDto) {
    const refreshTokenHash = hashToken(dto.refreshToken);

    const token = await this.refreshRepository.findOne({
      where: {
        token_hash: refreshTokenHash,
      },
    });

    if (!token) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (token.revoked) {
      await this.refreshRepository.update(
        {
          token_family: token.token_family,
        },
        {
          revoked: true,
        }
      );

      await this.sessionRepository.update(
        {
          id: token.session_id,
        },
        {
          active: false,
          logout_at: new Date(),
        }
      );
      await this.auditRepository.save({
        user_id: token.user_id,
        module_name: 'AUTH',
        entity_name: 'REFRESH_TOKEN',
        action: 'TOKEN_REUSE_DETECTED',
        created_at: new Date(),
      });
      throw new UnauthorizedException('Token reutilizado detectado');
    }

    if (token.expires_at && token.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const session = await this.sessionRepository.findOne({
      where: {
        id: token.session_id,
        active: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Sesión cerrada');
    }

    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    });

    const accessToken = await this.jwtService.signAsync({
      sub: payload.sub,
      uid: payload.uid,
      email: payload.email,
      sessionId: payload.sessionId,
    });

    token.revoked = true;

    token.used_at = new Date();

    const newRefreshToken = await this.generateRefreshToken(
      payload.sub,
      payload.uid,
      payload.email,
      payload.sessionId,
      payload.familyId
    );

    const newRefreshTokenHash = hashToken(newRefreshToken);

    //await this.refreshRepository.save(token);

    const refreshRecord = await this.refreshRepository.save({
      user_id: payload.sub,

      session_id: payload.sessionId,

      token_family: payload.familyId,

      token_hash: newRefreshTokenHash,

      expires_at: dayjs().add(30, 'day').toDate(),

      revoked: false,

      created_at: new Date(),
    });

    token.replaced_by = refreshRecord.id;

    await this.refreshRepository.save(token);
    await this.auditRepository.save({
      user_id: payload.sub,
      module_name: 'AUTH',
      entity_name: 'REFRESH_TOKEN',
      action: 'REFRESH',
      created_at: new Date(),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  me(user: { id: string; uid: string; email: string }) {
    return user;
  }

  async logout(userId: string, sessionId: string) {
    await this.sessionRepository.update(
      {
        id: sessionId,
        user_id: userId,
      },
      {
        active: false,
        logout_at: new Date(),
      }
    );

    await this.refreshRepository.update(
      {
        session_id: sessionId,
        revoked: false,
      },
      {
        revoked: true,
      }
    );

    await this.auditRepository.save({
      user_id: userId,
      module_name: 'AUTH',
      entity_name: 'LOGOUT',
      action: 'LOGOUT',
      created_at: new Date(),
    });

    return {
      success: true,
    };
  }

  async logoutAll(userId: string) {
    await this.sessionRepository.update(
      {
        user_id: userId,
        active: true,
      },
      {
        active: false,
        logout_at: new Date(),
      }
    );

    await this.refreshRepository.update(
      {
        user_id: userId,
        revoked: false,
      },
      {
        revoked: true,
      }
    );

    await this.auditRepository.save({
      user_id: userId,
      module_name: 'AUTH',
      entity_name: 'LOGOUT_ALL',
      action: 'LOGOUT_ALL',
      created_at: new Date(),
    });

    return {
      success: true,
    };
  }
}
