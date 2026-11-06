import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import dayjs from 'dayjs';

import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { Repository } from 'typeorm';

import { UserProfile } from '../users/entities/user-profile.entity';

import { Application } from '../applications/entities/application.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { NavigationService } from '../navigation/navigation.service';
import { PermissionCache } from '../permissions/entities/permission-cache.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { PermissionCacheService } from '../permissions/permission-cache.service';
import { Resource } from '../resources/entities/resource.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { RolesService } from '../roles/roles.service';

import { RefreshToken } from './entities/refresh-token.entity';
import { UserSession } from './entities/user-session.entity';

import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { SupabaseOAuthUser } from './interfaces/supabase-oauth-user.interface';
import { hashToken } from './utils/hash-token.util';

import { BadRequestException } from '@nestjs/common';

interface SupabaseLoginResponse {
  user: {
    id: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rolesService: RolesService,
    private readonly permissionCacheService: PermissionCacheService,
    private readonly navigationService: NavigationService,

    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,

    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

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
    private readonly auditRepository: Repository<AuditLog>,

    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>
  ) {}

  private async authenticateWithSupabase(email: string, password: string) {
    const response = await fetch(
      `${this.configService.getOrThrow('SUPABASE_URL')}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: this.configService.getOrThrow('SUPABASE_ANON_KEY'),

          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = (await response.json()) as SupabaseLoginResponse;

    if (!response.ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return data;
  }

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

      const alreadyExists = cacheRows.some(
        (row) =>
          row.user_id === userId &&
          row.application_id === item.application_id &&
          row.resource_id === item.resource_id &&
          row.permission_code === permission.permission_code
      );

      if (alreadyExists) {
        continue;
      }

      cacheRows.push({
        user_id: userId,
        role_id: item.role_id,
        resource_id: item.resource_id,
        application_id: item.application_id,

        permission_id: permission.id,
        permission_code: permission.permission_code,

        calculated_at: new Date(),
        active: true,
      });
    }

    if (cacheRows.length) {
      await this.permissionCacheRepository.save(cacheRows);
    }
  }

  ////////Justificación
  ////////La construcción del cache debe tener un único responsable: PermissionCacheService

  // private async getUserPermissions(
  //   userId: string
  // ): Promise<Record<string, Record<string, string[]>>> {
  //   const cache = await this.loadPermissionCache(userId);

  //   if (cache) {
  //     console.log('RBAC CACHE HIT');

  //     return cache;
  //   }
  //   const userRoles = await this.userRoleRepository.find({
  //     where: {
  //       user_id: userId,
  //       active: true,
  //     },
  //   });

  //   if (!userRoles.length) {
  //     return {};
  //   }

  //   const roleIds = userRoles.map((role) => role.role_id);

  //   const rolePermissions = await this.rolePermissionRepository.find({
  //     where: {
  //       active: true,
  //     },
  //   });

  //   const filteredPermissions = rolePermissions.filter((rp) => roleIds.includes(rp.role_id));

  //   await this.savePermissionCache(userId, filteredPermissions);

  //   const result: Record<string, Record<string, string[]>> = {};

  //   for (const item of filteredPermissions) {
  //     const permission = await this.permissionRepository.findOne({
  //       where: {
  //         id: item.permission_id,
  //         active: true,
  //       },
  //     });

  //     if (!permission) {
  //       continue;
  //     }

  //     const resource = await this.resourceRepository.findOne({
  //       where: {
  //         id: item.resource_id,
  //         active: true,
  //       },
  //     });

  //     if (!resource) {
  //       continue;
  //     }

  //     const application = await this.applicationRepository.findOne({
  //       where: {
  //         id: item.application_id,
  //         active: true,
  //       },
  //     });

  //     if (!application) {
  //       continue;
  //     }

  //     const applicationKey = application.code;

  //     const resourceKey = resource.internal_name;

  //     const action = permission.permission_code;

  //     if (!result[applicationKey]) {
  //       result[applicationKey] = {};
  //     }

  //     if (!result[applicationKey][resourceKey]) {
  //       result[applicationKey][resourceKey] = [];
  //     }

  //     if (!result[applicationKey][resourceKey].includes(action)) {
  //       result[applicationKey][resourceKey].push(action);
  //     }
  //   }

  //   return result;
  // }

  private async getUserPermissions(
    userId: string
  ): Promise<Record<string, Record<string, string[]>>> {
    const cache = await this.loadPermissionCache(userId);

    if (cache) {
      console.log('RBAC CACHE HIT');

      return cache;
    }

    console.error(`RBAC CACHE MISS FOR USER ${userId}`);

    throw new BadRequestException('Permission cache not generated');
  }

  private async generatePlatformTokens(profile: UserProfile) {
    const permissions = await this.getUserPermissions(profile.id);

    const roles = await this.rolesService.getUserRoles(profile.id);

    const session = await this.sessionRepository.save({
      user_id: profile.id,
      login_at: new Date(),
      active: true,
    });

    const payload = {
      sub: profile.id,
      uid: profile.auth_user_id,
      email: profile.email,
      roles,
      permissions,
      sessionId: session.id,
    };

    const familyId = crypto.randomUUID();

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.generateRefreshToken(
      profile.id,
      profile.auth_user_id,
      profile.email,
      session.id,
      familyId
    );

    const refreshTokenHash = hashToken(refreshToken);

    await this.refreshRepository.save({
      user_id: profile.id,
      token_hash: refreshTokenHash,
      session_id: session.id,
      token_family: familyId,
      expires_at: dayjs().add(30, 'day').toDate(),
      revoked: false,
      created_at: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
      roles,
      permissions,
    };
  }

  async invalidatePermissionCache(userId: string): Promise<void> {
    await this.permissionCacheRepository.delete({
      user_id: userId,
    });
  }

  private async synchronizeUserProfile(oauthUser: {
    auth_user_id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  }): Promise<UserProfile> {
    let profile = await this.userProfileRepository.findOne({
      where: {
        auth_user_id: oauthUser.auth_user_id,
      },
    });

    if (profile) {
      return profile;
    }

    profile = this.userProfileRepository.create({
      auth_user_id: oauthUser.auth_user_id,

      email: oauthUser.email,

      full_name: oauthUser.full_name,

      avatar_url: oauthUser.avatar_url,

      active: true,
    });

    const savedProfile = await this.userProfileRepository.save(profile);

    await this.auditRepository.save({
      user_id: savedProfile.id,

      module_name: 'AUTH',

      entity_name: 'USER_PROFILE',

      action: 'GOOGLE_REGISTER',

      new_values: {
        auth_user_id: savedProfile.auth_user_id,
        email: savedProfile.email,
      },

      created_at: new Date(),
    });

    return savedProfile;
  }

  private async assignGuestRoleIfNeeded(userId: string): Promise<boolean> {
    const guestRole = await this.roleRepository.findOne({
      where: {
        internal_name: 'guest',
        active: true,
      },
    });

    if (!guestRole) {
      throw new BadRequestException('No existe un rol activo GUEST configurado');
    }

    const existingRole = await this.userRoleRepository.findOne({
      where: {
        user_id: userId,
        role_id: guestRole.id,
        active: true,
      },
    });

    if (existingRole) {
      return false;
    }

    await this.userRoleRepository.save({
      user_id: userId,
      role_id: guestRole.id,
      active: true,
    });

    await this.auditRepository.save({
      user_id: userId,
      module_name: 'AUTH',
      entity_name: 'USER_ROLE',
      action: 'ASSIGN_GUEST_ROLE',
      created_at: new Date(),
    });

    return true;
  }

  private async validateProvisioning(userId: string): Promise<void> {
    const activeRoles = await this.userRoleRepository.count({
      where: {
        user_id: userId,
        active: true,
      },
    });

    if (activeRoles === 0) {
      throw new BadRequestException('Provisioning inválido: usuario sin roles');
    }

    const cachedPermissions = await this.permissionCacheRepository.count({
      where: {
        user_id: userId,
        active: true,
      },
    });

    if (cachedPermissions === 0) {
      throw new BadRequestException('Provisioning inválido: permission cache vacío');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const supabaseAuth = await this.authenticateWithSupabase(email, password);
    const profile = await this.userProfileRepository.findOne({
      where: {
        auth_user_id: supabaseAuth.user.id,
        active: true,
      },
    });

    if (!profile) {
      throw new UnauthorizedException('Perfil de usuario no encontrado');
    }

    const permissions = await this.getUserPermissions(profile.id);

    const roles = await this.rolesService.getUserRoles(profile.id);

    const payload = {
      sub: profile.id,

      uid: profile.auth_user_id,

      email: profile.email,

      roles,
      permissions,
    };

    ////////una sola sesión activa por usuario, se cierra la sesión anterior y se revocan los refresh tokens activos

    await this.sessionRepository.update(
      {
        user_id: profile.id,
        active: true,
      },
      {
        active: false,
        logout_at: new Date(),
      }
    );

    await this.refreshRepository.update(
      {
        user_id: profile.id,
        revoked: false,
      },
      {
        revoked: true,
      }
    );

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
        email: payload.email,
      },
    };
  }

  getGoogleAuthUrl() {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');

    const provider = this.configService.get<string>('GOOGLE_PROVIDER') ?? 'google';

    const redirectTo = this.configService.getOrThrow<string>('FRONTEND_CALLBACK_URL');

    const authUrl =
      `${supabaseUrl}/auth/v1/authorize` +
      `?provider=${provider}` +
      `&redirect_to=${encodeURIComponent(redirectTo)}`;

    // FASE 10:
    // Registrar evento OAUTH_START
    // cuando exista esquema de auditoría OAuth.
    return {
      authUrl,
    };
  }

  async googleCallback(accessToken: string) {
    if (!accessToken) {
      throw new BadRequestException('Access token requerido');
    }

    const response = await fetch(`${this.configService.getOrThrow('SUPABASE_URL')}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,

        apikey: this.configService.getOrThrow('SUPABASE_ANON_KEY'),
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Token OAuth inválido');
    }

    const user = (await response.json()) as SupabaseOAuthUser;

    // await this.auditRepository.save({
    //   module_name: 'AUTH',

    //   entity_name: 'GOOGLE_OAUTH',

    //   action: 'OAUTH_CALLBACK',

    //   new_values: {
    //     auth_user_id: user.id,
    //     email: user.email,
    //     provider: 'google',
    //   },

    //   created_at: new Date(),
    // });

    const existingProfile = await this.userProfileRepository.findOne({
      where: {
        auth_user_id: user.id,
      },
    });

    const profileCreated = !existingProfile; //////////////////////////////////////

    const profile = await this.synchronizeUserProfile({
      auth_user_id: user.id,

      email: user.email ?? '',

      full_name:
        typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : undefined,

      avatar_url:
        typeof user.user_metadata?.avatar_url === 'string'
          ? user.user_metadata.avatar_url
          : undefined,
    });

    await this.auditRepository.save({
      user_id: profile.id,

      module_name: 'AUTH',

      entity_name: 'GOOGLE_OAUTH',

      action: 'OAUTH_CALLBACK',

      new_values: {
        auth_user_id: user.id,
        email: user.email,
        provider: 'google',
      },

      created_at: new Date(),
    });

    if (profileCreated) {
      await this.auditRepository.save({
        user_id: profile.id,

        module_name: 'AUTH',

        entity_name: 'USER_PROFILE',

        action: 'FIRST_ACCESS',

        new_values: {
          auth_user_id: profile.auth_user_id,
          email: profile.email,
        },

        created_at: new Date(),
      });
    }

    // const guestAssigned = await this.assignGuestRoleIfNeeded(profile.id); ///////////////////////

    // const generatedPermissions = await this.permissionCacheService.generateUserPermissionCache(
    //   profile.id
    // );

    // await this.auditRepository.save({
    //   user_id: profile.id,
    //   module_name: 'AUTH',
    //   entity_name: 'PERMISSION_CACHE',
    //   action: 'INITIAL_CACHE_GENERATED',
    //   created_at: new Date(),
    // });

    // await this.validateProvisioning(profile.id);

    // const hasMenus = await this.navigationService.hasAvailableMenus(profile.id);

    // if (!hasMenus) {
    //   throw new BadRequestException('Provisioning inválido: no existen menús visibles');
    // }

    // await this.auditRepository.save({
    //   user_id: profile.id,
    //   module_name: 'AUTH',
    //   entity_name: 'NAVIGATION',
    //   action: 'MENU_PROVISIONED',
    //   new_values: {
    //     menuAccess: true,
    //   },
    //   created_at: new Date(),
    // });

    let guestAssigned = false;
    let generatedPermissions = 0;

    if (profileCreated) {
      guestAssigned = await this.assignGuestRoleIfNeeded(profile.id);

      generatedPermissions = await this.permissionCacheService.generateUserPermissionCache(
        profile.id
      );

      await this.auditRepository.save({
        user_id: profile.id,
        module_name: 'AUTH',
        entity_name: 'PERMISSION_CACHE',
        action: 'INITIAL_CACHE_GENERATED',
        created_at: new Date(),
      });

      await this.validateProvisioning(profile.id);

      const hasMenus = await this.navigationService.hasAvailableMenus(profile.id);

      if (!hasMenus) {
        throw new BadRequestException('Provisioning inválido: no existen menús visibles');
      }

      await this.auditRepository.save({
        user_id: profile.id,
        module_name: 'AUTH',
        entity_name: 'NAVIGATION',
        action: 'MENU_PROVISIONED',
        new_values: {
          menuAccess: true,
        },
        created_at: new Date(),
      });
    }

    const authResult = await this.generatePlatformTokens(profile);

    await this.auditRepository.save({
      user_id: profile.id,

      module_name: 'AUTH',

      entity_name: 'JWT',

      action: 'GOOGLE_LOGIN',

      new_values: {
        session_id: authResult.sessionId,
        email: profile.email,
      },

      created_at: new Date(),
    });

    return {
      authenticated: true,

      profileCreated,

      guestAssigned,

      permissionCacheGenerated: true,

      permissionRecords: generatedPermissions,

      accessToken: authResult.accessToken,

      refreshToken: authResult.refreshToken,

      sessionId: authResult.sessionId,

      user: {
        auth_user_id: profile.auth_user_id,

        email: profile.email,

        full_name: profile.full_name,

        avatar_url: profile.avatar_url,

        roles: authResult.roles,
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

    const roles = await this.rolesService.getUserRoles(payload.sub);

    const permissions = await this.getUserPermissions(payload.sub);

    const accessToken = await this.jwtService.signAsync({
      sub: payload.sub,
      uid: payload.uid,
      email: payload.email,
      sessionId: payload.sessionId,
      roles,
      permissions,
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
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        user_id: userId,
        active: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

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
