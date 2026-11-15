import { ApiProperty } from '@nestjs/swagger';

export class CreateNavigationDto {
  @ApiProperty({
    example: 'USERS',
    required: false,
    description: `
        Nombre interno del elemento de navegación.

        Ejemplos:

        - DASHBOARD
        - USERS
        - ROLES
        - PERMISSIONS
        - AUDIT

        Representa la opción funcional que será mostrada dentro del menú dinámico basado en RBAC.
        `,
  })
  internal_name?: string;

  @ApiProperty({
    example: 'Usuarios',
    required: false,
    description: `
        Nombre visible mostrado al usuario final dentro de la interfaz del sistema.
        `,
  })
  external_name?: string;

  @ApiProperty({
    example: '/iam/users',
    required: false,
    description: `
        Ruta de navegación utilizada por el frontend al seleccionar el elemento del menú.
        `,
  })
  route?: string;

  @ApiProperty({
    example: 'people',
    required: false,
    description: `
        Identificador del icono asociado al menú para representación visual en la interfaz.
        `,
  })
  icon?: string;

  @ApiProperty({
    example: 10,
    required: false,
    description: `
        Orden de aparición dentro del menú.

        Los valores más bajos se muestran primero.
        `,
  })
  order?: number;

  @ApiProperty({
    example: true,
    required: false,
    description: `
Indica si el elemento debe mostrarse en la navegación.

true  = visible
false = oculto
`,
  })
  visible?: boolean;

  @ApiProperty({
    example: '30aa6643-de90-4dee-845c-687a31dc781f',
    required: false,
    description: `
        UUID de la aplicación asociada al elemento de navegación.

        Relación arquitectónica:

        Application
        ↓
        Module
        ↓
        Navigation
        ↓
        Role Modules
        ↓
        Permission Cache
        ↓
        JWT
        ↓
        Menú del usuario
        `,
  })
  application_id?: string;

  @ApiProperty({
    example: 'c4cfca5f-3f63-4d2b-88dd-31cf47bd5f18',
    required: false,
    description: `
        UUID del módulo asociado al menú.

        Permite construir menús dinámicos basados en módulos habilitados para cada rol.
        `,
  })
  module_id?: string;

  @ApiProperty({
    required: false,
    description: `
        La estructura real del DTO debe documentarse conforme se complete la implementación del módulo Navigation.

        Este bloque sirve como documentación funcional preliminar para Swagger mientras se define el modelo definitivo de navegación dinámica.
        `,
  })
  placeholder?: string;
}
