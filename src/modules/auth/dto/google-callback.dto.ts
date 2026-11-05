import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleCallbackDto {
  @ApiProperty()
  @IsString()
  accessToken!: string;
}
