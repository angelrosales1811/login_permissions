import { ApiProperty } from '@nestjs/swagger';

export class GoogleOAuthUserDto {
  @ApiProperty()
  auth_user_id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  full_name?: string;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  avatar_url?: string;
}
