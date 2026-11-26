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

import { AuditLogService } from '../../common/services/audit-log.service';
import { Application } from '../applications/entities/application.entity';
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
import { AUDIT_ACTIONS } from '../../common/constants/audit-actions.constant';
import { AUDIT_ENTITIES } from '../../common/constants/audit-entities.constant';
import { TokenIntrospectionResponseDto } from './dto/token-introspection-response.dto';
import { TokenIntrospectionDto } from './dto/token-introspection.dto';

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
    private readonly auditLogService: AuditLogService,
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

    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>
  ) {}

  private async getIamApplicationId(): Promise<string | undefined> {
    const application = await this.applicationRepository.findOne({
      where: {
        code: 'IAM',
        active: true,
      },
    });

    return application?.id;
  }

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

  private async getUserPermissions(
    userId: string
  ): Promise<Record<string, Record<string, string[]>>> {
    const cache = await this.loadPermissionCache(userId);

    if (cache) {
      console.log(`[RBAC] CACHE HIT ${userId}`);
      await this.auditLogService.record({
        userId,
        action: AUDIT_ACTIONS.CACHE_HIT,
        moduleName: 'AUTH',
        entityName: AUDIT_ENTITIES.PERMISSION_CACHE,
        recordId: userId,
      });

      return cache;
    }

    console.warn(`[RBAC] CACHE MISS ${userId}`);
    await this.auditLogService.record({
      userId,
      action: AUDIT_ACTIONS.CACHE_MISS,
      moduleName: 'AUTH',
      entityName: AUDIT_ENTITIES.PERMISSION_CACHE,
      recordId: userId,
    });

    const rebuilt = await this.permissionCacheService.rebuildUserPermissionCache(userId);

    if (rebuilt === 0) {
      throw new UnauthorizedException('User without permissions');
    }

    console.warn(`[RBAC] CACHE RECOVERED ${userId}`);
    await this.auditLogService.record({
      userId,
      action: AUDIT_ACTIONS.CACHE_RECOVERED,
      moduleName: 'AUTH',
      entityName: AUDIT_ENTITIES.PERMISSION_CACHE,
      recordId: userId,
    });

    const repairedCache = await this.loadPermissionCache(userId);

    return repairedCache ?? {};
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

    const applicationId = await this.getIamApplicationId();

    await this.auditLogService.record({
      userId: savedProfile.id,
      applicationId,
      action: AUDIT_ACTIONS.GOOGLE_REGISTER,
      moduleName: 'AUTH',
      entityName: AUDIT_ENTITIES.USER_PROFILE,
      recordId: savedProfile.id,
      newValues: {
        auth_user_id: savedProfile.auth_user_id,
        email: savedProfile.email,
      },
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

    const applicationId = await this.getIamApplicationId();

    await this.auditLogService.record({
      userId,
      applicationId,
      action: AUDIT_ACTIONS.ASSIGN_GUEST_ROLE,
      moduleName: 'AUTH',
      entityName: AUDIT_ENTITIES.USER_ROLE,
      recordId: userId,
      newValues: {
        roleId: guestRole.id,
      },
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

    const applicationId = await this.getIamApplicationId();

    await this.auditLogService.record({
      userId: profile.id,
      applicationId,
      action: AUDIT_ACTIONS.LOGIN,
      moduleName: 'AUTH',
      entityName: AUDIT_ENTITIES.USER,
      recordId: profile.id,
      newValues: {
        email: profile.email,
        sessionId: session.id,
        authUserId: profile.auth_user_id,
        roles,
      },
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

    const applicationId = await this.getIamApplicationId();

    await this.auditLogService.record({
      userId: profile.id,
      applicationId,
      action: AUDIT_ACTIONS.LOGIN,
      moduleName: 'AUTH',
      entityName: AUDIT_ENTITIES.USER,
      recordId: profile.id,
      newValues: {
        provider: 'GOOGLE',
        authUserId: user.id,
        email: profile.email,
      },
    });

    if (profileCreated) {
      await this.auditLogService.record({
        userId: profile.id,
        applicationId,
        action: AUDIT_ACTIONS.FIRST_ACCESS,
        moduleName: 'AUTH',
        entityName: AUDIT_ENTITIES.USER_PROFILE,
        recordId: profile.id,
        newValues: {
          authUserId: profile.auth_user_id,
          email: profile.email,
        },
      });
    }

    let guestAssigned = false;
    let generatedPermissions = 0;

    if (profileCreated) {
      guestAssigned = await this.assignGuestRoleIfNeeded(profile.id);

      generatedPermissions = await this.permissionCacheService.generateUserPermissionCache(
        profile.id
      );

      await this.auditLogService.record({
        applicationId,
        action: AUDIT_ACTIONS.INITIAL_CACHE_GENERATED,
        moduleName: 'AUTH',
        entityName: AUDIT_ENTITIES.PERMISSION_CACHE,
        recordId: profile.id,
        newValues: {
          permissionRecords: generatedPermissions,
        },
      });

      await this.validateProvisioning(profile.id);

      const hasMenus = await this.navigationService.hasAvailableMenus(profile.id);

      if (!hasMenus) {
        throw new BadRequestException('Provisioning inválido: no existen menús visibles');
      }

      await this.auditLogService.record({
        applicationId,
        action: AUDIT_ACTIONS.MENU_PROVISIONED,
        moduleName: 'AUTH',
        entityName: AUDIT_ENTITIES.NAVIGATION,
        recordId: profile.id,
        newValues: {
          menuAccess: true,
        },
      });
    }

    const authResult = await this.generatePlatformTokens(profile);

    await this.auditLogService.record({
      userId: profile.id,
      applicationId,
      action: AUDIT_ACTIONS.GOOGLE_LOGIN,
      moduleName: 'AUTH',
      entityName: AUDIT_ENTITIES.JWT,
      recordId: profile.id,
      newValues: {
        sessionId: authResult.sessionId,
        email: profile.email,
      },
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

      const applicationId = await this.getIamApplicationId();

      await this.auditLogService.record({
        userId: token.user_id,
        applicationId,
        action: AUDIT_ACTIONS.REFRESH_TOKEN_REUSE_DETECTED,
        moduleName: 'AUTH',
        entityName: AUDIT_ENTITIES.REFRESH_TOKEN,
        recordId: token.user_id,
        newValues: {
          tokenFamily: token.token_family,
        },
      });

      throw new UnauthorizedException('Token reutilizado detectado');
    }

    if (token.expires_at && token.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    });
    const session = await this.sessionRepository.findOne({
      where: {
        id: token.session_id,
        active: true,
      },
    });

    if (!session) {
      await this.auditLogService.record({
        userId: payload.sub,

        action: AUDIT_ACTIONS.INVALID_SESSION,

        moduleName: 'AUTH',

        entityName: AUDIT_ENTITIES.USER_SESSION,

        recordId: payload.sub,
      });
      throw new UnauthorizedException('Sesión cerrada');
    }

    // const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
    //   secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    // });

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

    const applicationId = await this.getIamApplicationId();

    await this.auditLogService.record({
      userId: payload.sub,
      applicationId,
      action: AUDIT_ACTIONS.REFRESH,
      moduleName: 'AUTH',
      entityName: AUDIT_ENTITIES.REFRESH_TOKEN,
      recordId: payload.sub,
      newValues: {
        sessionId: payload.sessionId,
        tokenFamily: payload.familyId,
        email: payload.email,
        uid: payload.uid,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async me(user: {
    id: string;
    uid: string;
    email: string;
    roles?: string[];
    permissions?: Record<string, Record<string, string[]>>;
    sessionId?: string;
  }) {
    const profile = await this.userProfileRepository.findOne({
      where: {
        id: user.id,
      },
    });

    return {
      id: user.id,
      uid: user.uid,
      email: user.email,

      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,

      sessionId: user.sessionId,

      roles: user.roles ?? [],

      permissions: user.permissions ?? {},
    };
  }

  async introspectToken(dto: TokenIntrospectionDto): Promise<TokenIntrospectionResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        uid: string;
        email: string;
        sessionId: string;
        roles?: string[];
        exp: number;
      }>(dto.token);

      const user = await this.userProfileRepository.findOne({
        where: {
          id: payload.sub,
          active: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      const session = await this.sessionRepository.findOne({
        where: {
          id: payload.sessionId,
          user_id: payload.sub,
          active: true,
        },
      });

      if (!session) {
        throw new UnauthorizedException('Sesión inactiva');
      }

      const roles = await this.rolesService.getUserRoles(payload.sub);

      await this.auditLogService.record({
        userId: payload.sub,
        action: AUDIT_ACTIONS.TOKEN_INTROSPECTION,
        moduleName: 'AUTH',
        entityName: AUDIT_ENTITIES.JWT,
        recordId: payload.sub,
        success: true,
        newValues: {
          sessionId: payload.sessionId,
        },
      });

      return {
        active: true,
        userId: payload.sub,
        email: payload.email,
        roles,
        sessionId: payload.sessionId,
        exp: payload.exp,
      };
    } catch {
      return {
        active: false,
        userId: '',
        email: '',
        roles: [],
        sessionId: '',
        exp: 0,
      };
    }
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

    const applicationId = await this.getIamApplicationId();

    await this.auditLogService.record({
      userId,
      applicationId,
      action: AUDIT_ACTIONS.LOGOUT,
      moduleName: 'AUTH',
      entityName: AUDIT_ENTITIES.USER_SESSION,
      recordId: userId,
      newValues: {
        sessionId,
        userId,
      },
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

    const applicationId = await this.getIamApplicationId();

    await this.auditLogService.record({
      userId,
      applicationId,
      action: AUDIT_ACTIONS.LOGOUT_ALL,
      moduleName: 'AUTH',
      entityName: AUDIT_ENTITIES.USER_SESSION,
      recordId: userId,
    });

    return {
      success: true,
    };
  }
}
