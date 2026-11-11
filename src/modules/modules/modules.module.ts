import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';

import { Resource } from '../resources/entities/resource.entity';
import { ResourcesModule } from '../resources/resources.module';
import { ModuleResource } from './entities/module-resource.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { RoleModule } from './entities/role-module.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuleEntity, ModuleResource, RoleModule, Resource]),
    ResourcesModule,
  ],
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
