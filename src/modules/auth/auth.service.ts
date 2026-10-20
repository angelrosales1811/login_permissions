import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { Repository } from 'typeorm';

import { UserSession } from './entities/user-session.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>
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

    await this.userSessionRepository.save({
      user_id: payload.sub,
      login_at: new Date(),
      active: true,
    });

    return {
      accessToken,
      user: {
        uid: payload.uid,
        email,
      },
    };
  }

  refresh(_dto: RefreshTokenDto) {
    return {
      message: 'Refresh pendiente de implementación',
    };
  }

  me(user: { id: string; uid: string; email: string }) {
    return user;
  }

  async logout(userId: string) {
    await this.userSessionRepository.update(
      {
        user_id: userId,
        active: true,
      },
      {
        active: false,
        logout_at: new Date(),
      }
    );

    return {
      success: true,
    };
  }
}
