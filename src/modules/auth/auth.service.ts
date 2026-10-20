import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

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

    return {
      accessToken,
      user: {
        uid: payload.uid,
        email,
      },
    };
  }

  me(user: { id: string; uid: string; email: string }) {
    return user;
  }
}
