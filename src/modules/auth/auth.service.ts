import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import dayjs from 'dayjs';

import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { Repository } from 'typeorm';

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
    private readonly refreshRepository: Repository<RefreshToken>
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

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.generateRefreshToken(payload.sub);
    const refreshTokenHash = hashToken(refreshToken);

    await this.refreshRepository.save({
      user_id: payload.sub,
      token_hash: refreshTokenHash,
      expires_at: dayjs().add(30, 'day').toDate(),
      revoked: false,
      created_at: new Date(),
    });

    console.log('ANTES SESSION');
    await this.sessionRepository.save({
      user_id: payload.sub,
      login_at: new Date(),
      active: true,
    });
    console.log('DESPUES SESSION');

    return {
      accessToken,
      refreshToken,
      user: {
        uid: payload.uid,
        email,
      },
    };
  }

  private async generateRefreshToken(userId: string) {
    const token = await this.jwtService.signAsync(
      {
        sub: userId,
      },
      {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),

        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN'),
      }
    );

    return token;
  }

  async refresh(dto: RefreshTokenDto) {
    const refreshTokenHash = hashToken(dto.refreshToken);

    const token = await this.refreshRepository.findOne({
      where: {
        token_hash: refreshTokenHash,
        revoked: false,
      },
    });

    if (!token) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (token.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
    });

    const accessToken = await this.jwtService.signAsync({
      sub: payload.sub,
    });

    token.revoked = true;

    const newRefreshToken = await this.generateRefreshToken(payload.sub);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await this.refreshRepository.save(token);

    await this.refreshRepository.save({
      user_id: payload.sub,
      token_hash: newRefreshTokenHash,
      expires_at: dayjs().add(30, 'day').toDate(),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  me(user: { id: string; uid: string; email: string }) {
    return user;
  }

  async logout(userId: string) {
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

    return {
      success: true,
    };
  }
}
