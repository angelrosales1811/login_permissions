export class PermissionMatrixResponseDto {
  role_id!: string;
  role!: string;

  module_id!: string;
  module!: string;

  resource_id!: string;
  resource!: string;

  permissions!: string[];
}
