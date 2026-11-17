import { ApiProperty } from '@nestjs/swagger';

export class AuditHistoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId?: string;

  @ApiProperty()
  moduleName?: string;

  @ApiProperty()
  entityName?: string;

  @ApiProperty()
  recordId?: string;

  @ApiProperty()
  action?: string;

  @ApiProperty()
  ip?: string;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty({
    type: Object,
  })
  oldValues?: object;

  @ApiProperty({
    type: Object,
  })
  newValues?: object;
}
