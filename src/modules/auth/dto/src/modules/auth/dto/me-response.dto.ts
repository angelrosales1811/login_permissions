import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000001',
    description: 'Identificador único del usuario',
  })
  id!: string;

  @ApiProperty({
    example: 'USR000001',
    description: 'Código único visible del usuario',
  })
  uid!: string;

  @ApiProperty({
    example: 'admin@crm.com',
    description: 'Correo electrónico del usuario',
  })
  email!: string;
}
