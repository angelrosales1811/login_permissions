import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

export class RolePermissionItemDto {
  @ApiProperty()
  @IsUUID()
  resourceId!: string;

  @ApiProperty()
  @IsUUID()
  permissionId!: string;

  @ApiProperty()
  @IsUUID()
  applicationId!: string;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({
    type: [RolePermissionItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionItemDto)
  permissions!: RolePermissionItemDto[];
}
