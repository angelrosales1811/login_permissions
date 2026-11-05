import { ApiProperty } from '@nestjs/swagger';

export class OAuthUrlResponseDto {
  @ApiProperty({
    example: 'https://nrrrowmjmjqlsbcjtdsj.supabase.co/auth/v1/authorize?provider=google',
    description: 'URL de autenticación OAuth Google',
  })
  authUrl: string;
}
