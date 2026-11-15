import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indica si el proceso de cierre de sesión fue ejecutado correctamente.',
  })
  success!: boolean;
}
