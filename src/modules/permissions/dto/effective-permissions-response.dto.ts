import { ApiProperty } from '@nestjs/swagger';

export class EffectivePermissionDto {
  @ApiProperty({
    example: 'USERS',
  })
  resource!: string;

  @ApiProperty({
    type: [String],
    example: ['444', '644', '777'],
  })
  actions!: string[];
}

export class EffectivePermissionsResponseDto {
  @ApiProperty({
    example: 'b50b33e8-1fa4-4d57-a1ed-164bf17d10b3',
  })
  userId!: string;

  @ApiProperty({
    type: [String],
    example: ['ADMIN'],
  })
  roles!: string[];

  @ApiProperty({
    type: [EffectivePermissionDto],
  })
  permissions!: EffectivePermissionDto[];
}
