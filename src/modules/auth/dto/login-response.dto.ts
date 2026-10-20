import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    example: 'USR000001',
    description: 'Identificador visible del usuario',
  })
  uid!: string;

  @ApiProperty({
    example: 'admin@crm.com',
    description: 'Correo electrónico del usuario',
  })
  email!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT de autenticación',
  })
  accessToken!: string;

  @ApiProperty({
    type: LoginUserDto,
    description: 'Información del usuario autenticado',
  })
  user!: LoginUserDto;
}
