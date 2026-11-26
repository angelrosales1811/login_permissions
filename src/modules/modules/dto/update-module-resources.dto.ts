import { IsArray, IsUUID } from 'class-validator';

export class UpdateModuleResourcesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  resourceIds!: string[];
}
