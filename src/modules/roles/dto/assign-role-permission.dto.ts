import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignRolePermissionDto {
  @ApiProperty()
  @IsUUID('4')
  resourceId!: string;

  @ApiProperty()
  @IsUUID('4')
  permissionId!: string;

  @ApiProperty()
  @IsUUID('4')
  applicationId!: string;
}
