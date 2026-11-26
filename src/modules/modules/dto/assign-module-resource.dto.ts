import { IsUUID } from 'class-validator';

export class AssignModuleResourceDto {
  @IsUUID()
  resourceId!: string;
}
