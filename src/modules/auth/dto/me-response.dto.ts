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
    example: {
      CRM: {
        USERS: ['CREATE', 'READ', 'UPDATE'],
        ROLES: ['READ'],
      },
    },
  })
  permissions!: Record<string, Record<string, string[]>>;
}
