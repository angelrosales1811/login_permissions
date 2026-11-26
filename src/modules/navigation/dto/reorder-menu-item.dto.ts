import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ReorderMenuItemDto {
  @ApiProperty({
    example: 3,
  })
  @IsInt()
  @Min(0)
  display_order!: number;
}
