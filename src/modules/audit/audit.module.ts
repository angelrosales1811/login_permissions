import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

import { Application } from '../applications/entities/application.entity';
import { AuditLog } from './entities/audit-log.entity';
import { UserAccessLog } from './entities/user-access-log.entity';
import { UserAccessLogService } from './user-access-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, UserAccessLog, Application])],
  controllers: [AuditController],
  providers: [AuditService, UserAccessLogService],
  exports: [AuditService, UserAccessLogService],
})
export class AuditModule {}
