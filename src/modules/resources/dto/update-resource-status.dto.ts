import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateResourceStatusDto {
  @ApiProperty()
  @IsBoolean()
  active!: boolean;
}
