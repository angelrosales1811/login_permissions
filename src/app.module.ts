import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import databaseConfig from './config/database/database.config';
import supabaseConfig from './config/supabase/supabase.config';

import { DocsModule } from './docs/docs.module';
import { HomeModule } from './home/home.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, supabaseConfig],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres',

        host: configService.get<string>('database.host'),

        port: configService.get<number>('database.port'),

        username: configService.get<string>('database.username'),

        password: configService.get<string>('database.password'),

        database: configService.get<string>('database.database'),

        autoLoadEntities: true,

        synchronize: false,

        logging: true,

        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),
    HomeModule,
    DocsModule,
    AuthModule,
    UsersModule,
    RolesModule,
  ],
})
export class AppModule {}
