import { ApiProperty } from '@nestjs/swagger';

export class MenuCRUDResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  internalName!: string;

  @ApiProperty()
  externalName!: string;

  @ApiProperty()
  icon?: string;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  applicationId!: string;

  @ApiProperty()
  created_by?: string;

  @ApiProperty()
  created_at?: Date;

  @ApiProperty()
  updated_by?: string;

  @ApiProperty()
  updated_at?: Date;

  @ApiProperty()
  ip_creation?: string;

  @ApiProperty()
  ip_update?: string;
}
