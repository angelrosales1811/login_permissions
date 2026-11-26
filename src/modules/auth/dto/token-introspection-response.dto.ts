import { ApiProperty } from '@nestjs/swagger';

export class TokenIntrospectionResponseDto {
  @ApiProperty({
    example: true,
  })
  active!: boolean;

  @ApiProperty({
    example: 'abc97121-c050-4bbe-a6e1-b39ccb68da0b',
  })
  userId!: string;

  @ApiProperty({
    example: 'admin@crm.com',
  })
  email!: string;

  @ApiProperty({
    type: [String],
    example: ['IAM_ADMIN', 'ADMINISTRADOR'],
  })
  roles!: string[];

  @ApiProperty({
    example: '28c9b618-e4e8-492a-8070-abb5540e394b',
  })
  sessionId!: string;

  @ApiProperty({
    example: 1778000000,
  })
  exp!: number;
}
