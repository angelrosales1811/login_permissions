import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AuditHistoryQueryDto } from './dto/audit-history-query.dto';
import { AuditLog } from './entities/audit-log.entity';
import { UserAccessLog } from './entities/user-access-log.entity';

import { Injectable } from '@nestjs/common';

import { AUDIT_ACTIONS } from '../../common/constants/audit-actions.constant';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    @InjectRepository(UserAccessLog)
    private readonly accessRepository: Repository<UserAccessLog>
  ) {}

  async getHistory(filters: AuditHistoryQueryDto) {
    const page = Number(filters.page ?? 1);

    const limit = Number(filters.limit ?? 50);

    const query: SelectQueryBuilder<AuditLog> = this.auditRepository.createQueryBuilder('audit');

    if (filters.entity) {
      query.andWhere('UPPER(audit.entity_name) = UPPER(:entity)', {
        entity: filters.entity,
      });
    }

    if (filters.action) {
      query.andWhere('UPPER(audit.action) = UPPER(:action)', {
        action: filters.action,
      });
    }

    if (filters.userId) {
      query.andWhere('audit.user_id = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.fromDate) {
      query.andWhere('audit.created_at >= :fromDate', {
        fromDate: filters.fromDate,
      });
    }

    if (filters.toDate) {
      query.andWhere('audit.created_at <= :toDate', {
        toDate: filters.toDate,
      });
    }

    query
      .orderBy('audit.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      total,
      page,
      limit,
      items,
    };
  }

  async getEntityHistory(entity: string, id: string) {
    return this.auditRepository.find({
      where: {
        entityName: entity,
        recordId: id,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async getAccessHistory() {
    return this.accessRepository.find({
      order: {
        created_at: 'DESC',
      },
      take: 500,
    });
  }

  async findEntities() {
    return this.auditRepository
      .createQueryBuilder('audit')
      .select('audit.entityName')
      .distinct(true)
      .orderBy('audit.entityName', 'ASC')
      .getRawMany();
  }

  create(createAuditDto: CreateAuditDto) {
    console.log(createAuditDto);
    return 'This action adds a new audit';
  }

  findAll() {
    return `This action returns all audit`;
  }

  findOne(id: number) {
    return `This action returns a #${id} audit`;
  }

  update(id: number, updateAuditDto: UpdateAuditDto) {
    console.log(updateAuditDto);
    return `This action updates a #${id} audit`;
  }

  remove(id: number) {
    return `This action removes a #${id} audit`;
  }

  async getRbacMetrics() {
    const [
      cacheHit,
      cacheMiss,
      cacheRecovered,
      permissionDenied,
      invalidSession,
      refreshTokenReused,
    ] = await Promise.all([
      this.auditRepository.count({
        where: {
          action: AUDIT_ACTIONS.CACHE_HIT,
        },
      }),

      this.auditRepository.count({
        where: {
          action: AUDIT_ACTIONS.CACHE_MISS,
        },
      }),

      this.auditRepository.count({
        where: {
          action: AUDIT_ACTIONS.CACHE_RECOVERED,
        },
      }),

      this.auditRepository.count({
        where: {
          action: AUDIT_ACTIONS.PERMISSION_DENIED,
        },
      }),

      this.auditRepository.count({
        where: {
          action: AUDIT_ACTIONS.INVALID_SESSION,
        },
      }),

      this.auditRepository.count({
        where: {
          action: AUDIT_ACTIONS.REFRESH_TOKEN_REUSE_DETECTED,
        },
      }),
    ]);

    return {
      cacheHit,
      cacheMiss,
      cacheRecovered,
      permissionDenied,
      invalidSession,
      refreshTokenReused,
    };
  }
}
