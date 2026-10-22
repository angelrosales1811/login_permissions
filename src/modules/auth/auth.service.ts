import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import dayjs from 'dayjs';

import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { Repository } from 'typeorm';

import { AuditLog } from '../audit/entities/audit-log.entity';
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
    @InjectRepository(RefreshToken)
    private readonly refreshRepository: Repository<RefreshToken>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    if (email !== 'admin@crm.com' || password !== '123456') {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: '00000000-0000-0000-0000-000000000001',
      uid: 'USR000001',
      email,
    };

    const session = await this.sessionRepository.save({
      user_id: payload.sub,
      login_at: new Date(),
      active: true,
    });

    const accessPayload = {
      ...payload,
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
