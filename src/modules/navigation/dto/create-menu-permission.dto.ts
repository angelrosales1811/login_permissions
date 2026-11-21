import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateMenuPermissionDto {
  @ApiProperty()
  @IsUUID()
  menu_item_id!: string;

  @ApiProperty()
  @IsUUID()
  permission_id!: string;

  @ApiProperty()
  @IsUUID()
  application_id!: string;
}
