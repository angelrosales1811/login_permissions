import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Module as ModuleEntity } from '../modules/entities/module.entity';
import { MenuItemEntity } from './entities/menu-item.entity';
import { MenuPermissionEntity } from './entities/menu-permission.entity';
import { Menu } from './entities/menu.entity';

import { AuditContextService } from '../../common/services/audit-context.service';
import { AuditEntityService } from '../../common/services/audit-entity.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { NavigationController } from './navigation.controller';
import { NavigationService } from './navigation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Menu,
      MenuItemEntity,
      MenuPermissionEntity,
      AuditLogService,
      AuditContextService,
      AuditEntityService,
      ModuleEntity,
    ]),
  ],
  controllers: [NavigationController],
  providers: [NavigationService],
  exports: [NavigationService],
})
export class NavigationModule {}
