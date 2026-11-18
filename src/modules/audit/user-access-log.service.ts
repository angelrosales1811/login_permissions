import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';

import { RequestContextService } from '../../common/context/request-context.service';

import { UserAccessLog } from './entities/user-access-log.entity';

@Injectable()
export class UserAccessLogService {
  constructor(
    @InjectRepository(UserAccessLog)
    private readonly repository: Repository<UserAccessLog>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly requestContextService: RequestContextService
  ) {}

  private async resolveApplicationId(applicationCode: string): Promise<string | undefined> {
    const application = await this.applicationRepository.findOne({
      where: {
        code: applicationCode,
        active: true,
      },
    });

    return application?.id;
  }

  async register(data: {
    endpoint: string;
    method: string;
    action: string;
    moduleName: string;
    applicationCode: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const applicationId = await this.resolveApplicationId(data.applicationCode);
      await this.repository.save({
        user_id: this.requestContextService.getUserId() ?? undefined,

        application_id: applicationId,

        action: data.action,

        module_name: this.requestContextService.getModuleName() ?? data.moduleName,

        endpoint: data.endpoint,

        method: data.method,

        ip: this.requestContextService.getIp() ?? undefined,

        user_agent: data.userAgent,
      });
    } catch (error) {
      console.error('[ACCESS_LOG_ERROR]', error);
    }
  }
}
