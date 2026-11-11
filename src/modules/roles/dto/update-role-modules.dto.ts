import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpdateRoleModulesDto {
  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  moduleIds!: string[];
}
