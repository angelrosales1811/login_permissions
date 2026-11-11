import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleResource } from '../modules/entities/module-resource.entity';
import { Module as ModuleEntity } from '../modules/entities/module.entity';
import { Resource } from './entities/resource.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  imports: [TypeOrmModule.forFeature([Resource, ModuleResource, ModuleEntity])],
  controllers: [ResourcesController],
  providers: [ResourcesService],
})
export class ResourcesModule {}
