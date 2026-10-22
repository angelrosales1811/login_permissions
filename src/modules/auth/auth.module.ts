import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { JwtModule } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { AuditLog } from '../audit/entities/audit-log.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserSession } from './entities/user-session.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([UserSession, RefreshToken, AuditLog]),
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

  providers: [AuthService, JwtStrategy],

  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
