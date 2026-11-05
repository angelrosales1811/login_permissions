import { ApiProperty } from '@nestjs/swagger';

class GoogleUserDto {
  @ApiProperty()
  auth_user_id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  full_name?: string;

  @ApiProperty()
  avatar_url?: string;
}

export class GoogleCallbackResponseDto {
  @ApiProperty()
  authenticated: boolean;

  @ApiProperty()
  profileCreated: boolean;

  @ApiProperty({
    type: GoogleUserDto,
  })
  user: GoogleUserDto;
}
