import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PermissionsGuard } from '../auth/guards/permission.guard';

import { UseGuards } from '@nestjs/common';

import { Permissions } from '../auth/decorators/permission.decorator';

import { AuditHistoryQueryDto } from './dto/audit-history-query.dto';

import { AuditHistoryResponseDto } from './dto/audit-history-response.dto';

import { UserAccessHistoryQueryDto } from './dto/user-access-history-query.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('history')
  @Permissions('IAM', 'AUDIT', '644')
  @ApiOperation({
    summary: 'Consultar historial global de auditoría',
  })
  @ApiResponse({
    status: 200,
    type: AuditHistoryResponseDto,
    isArray: true,
  })
  @ApiQuery({
    name: 'entity',
    required: false,
  })
  @ApiQuery({
    name: 'action',
    required: false,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
  })
  findHistory(
    @Query()
    query: AuditHistoryQueryDto
  ) {
    return this.auditService.getHistory(query);
  }

  @Get('access-history')
  @Permissions('IAM', 'AUDIT', '644')
  @ApiOperation({
    summary: 'Consultar historial de accesos',
    description: `
Consulta los accesos registrados en security.user_access_log.

Fase:
4A.19 Auditoría de Accesos

Base para:
4A.20 Observabilidad y Métricas.
`,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de accesos obtenido correctamente',
  })
  getAccessHistory(
    @Query()
    query: UserAccessHistoryQueryDto
  ) {
    console.log(query);
    return this.auditService.getAccessHistory();
  }

  @Get('rbac-metrics')
  @ApiOperation({
    summary: 'Métricas RBAC',
    description: `
      Observabilidad del sistema RBAC.

      Incluye:

      - CACHE HIT
      - CACHE MISS
      - CACHE RECOVERED
      - PERMISSION DENIED
      - INVALID SESSION
      - REFRESH TOKEN REUSE
      `,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas RBAC obtenidas correctamente',
  })
  getRbacMetrics() {
    return this.auditService.getRbacMetrics();
  }

  @Get('entities')
  @ApiOperation({
    summary: 'Obtener catálogo de entidades auditadas',
  })
  @ApiResponse({
    status: 200,
  })
  findEntities() {
    return this.auditService.findEntities();
  }

  @Get('entity/:entity/:id')
  @Permissions('IAM', 'AUDIT', '644')
  @ApiOperation({
    summary: 'Consultar historial por entidad',
  })
  @ApiParam({
    name: 'entity',
    example: 'ROLES',
  })
  @ApiParam({
    name: 'id',
    example: '9bf51a27-180b-4f91-93ba-08623b0470af',
  })
  findEntityHistory(
    @Param('entity')
    entity: string,

    @Param('id')
    id: string
  ) {
    return this.auditService.getEntityHistory(entity, id);
  }

  @Get()
  findAll() {
    return this.auditService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(+id);
  }
}
