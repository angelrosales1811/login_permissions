import { IsBoolean } from 'class-validator';

export class UpdateModuleResourceStatusDto {
  @IsBoolean()
  active!: boolean;
}
