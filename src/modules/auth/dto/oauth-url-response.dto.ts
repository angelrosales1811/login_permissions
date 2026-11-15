import { ApiProperty } from '@nestjs/swagger';

export class OAuthUrlResponseDto {
  @ApiProperty({
    example:
      'https://nrrrowmjmjqlsbcjtdsj.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://localhost:4200/auth/callback',
    description: 'URL OAuth de Google generada por Supabase',
  })
  authUrl!: string;
}
