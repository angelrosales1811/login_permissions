import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Estado lógico del registro. false = desactivado (soft delete), true = activo.',
    example: false,
  })
  @IsBoolean()
  active!: boolean;
}
