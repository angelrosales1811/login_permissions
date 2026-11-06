import { Injectable } from '@nestjs/common';

import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';

@Injectable()
export class AuditService {
  // constructor(
  //   @InjectRepository(AuditLog)
  //   private readonly auditRepository: Repository<AuditLog>
  // ) {}

  // async logOAuthEvent(params: {
  //   userId?: string;
  //   action:
  //     'GOOGLE_REGISTER' | 'GOOGLE_LOGIN' | 'FIRST_ACCESS' | 'ASSIGN_GUEST_ROLE' | 'OAUTH_CALLBACK';
  //   ip?: string;
  //   applicationId?: string;
  //   newValues?: Record<string, any>;
  // }): Promise<void> {
  //   await this.auditRepository.save({
  //     user_id: params.userId,
  //     module_name: 'AUTH',
  //     entity_name: 'GOOGLE_OAUTH',
  //     action: params.action,
  //     new_values: params.newValues ?? {},
  //     ip: params.ip,
  //     application_id: params.applicationId,
  //     created_at: new Date(),
  //   });
  // }

  create(createAuditDto: CreateAuditDto) {
    return 'This action adds a new audit';
  }

  findAll() {
    return `This action returns all audit`;
  }

  findOne(id: number) {
    return `This action returns a #${id} audit`;
  }

  update(id: number, updateAuditDto: UpdateAuditDto) {
    return `This action updates a #${id} audit`;
  }

  remove(id: number) {
    return `This action removes a #${id} audit`;
  }
}
