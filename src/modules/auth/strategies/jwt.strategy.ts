import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesService } from '../../roles/roles.service';
import { UserSession } from '../entities/user-session.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly rolesService: RolesService,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const session = await this.sessionRepository.findOne({
      where: {
        id: payload.sessionId,
        user_id: payload.sub,
        active: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Sesión inválida');
    }
    const roles = await this.rolesService.getUserRoles(payload.sub);

    return {
      id: payload.sub,
      uid: payload.uid,
      email: payload.email,
      sessionId: payload.sessionId,
      roles,
    };
  }
}
