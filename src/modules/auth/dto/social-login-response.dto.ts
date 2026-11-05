import { ApiProperty } from '@nestjs/swagger';

class SocialUserDto {
  @ApiProperty()
  uid: string;

  @ApiProperty()
  email: string;
}

export class SocialLoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({
    type: SocialUserDto,
  })
  user: SocialUserDto;

  @ApiProperty({
    example: true,
  })
  isNewUser: boolean;
}
