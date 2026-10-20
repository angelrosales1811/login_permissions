import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  uid!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({
    type: [String],
  })
  roles!: string[];

  @ApiProperty({
    type: [String],
  })
  permissions!: string[];
}
