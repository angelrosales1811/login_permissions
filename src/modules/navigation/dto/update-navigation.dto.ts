import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateNavigationDto } from './create-navigation.dto';

export class UpdateNavigationDto extends PartialType(CreateNavigationDto) {
  @ApiProperty({
    required: false,
    example: 'USERS',
    description:
      'Nombre interno del elemento de navegación. Utilizado por el sistema para identificar de forma única una opción de menú dentro de la estructura de navegación dinámica.',
  })
  internal_name?: string;

  @ApiProperty({
    required: false,
    example: 'Usuarios',
    description:
      'Nombre visible mostrado al usuario final en menús, submenús y componentes de navegación.',
  })
  external_name?: string;

  @ApiProperty({
    required: false,
    example: '/iam/users',
    description:
      'Ruta del frontend asociada al elemento de navegación. Se utiliza cuando el usuario selecciona la opción dentro del menú.',
  })
  route?: string;

  @ApiProperty({
    required: false,
    example: 'people',
    description: 'Icono asociado visualmente al elemento de navegación.',
  })
  icon?: string;

  @ApiProperty({
    required: false,
    example: 10,
    description:
      'Orden de visualización dentro del menú. Los valores menores se muestran antes que los valores mayores.',
  })
  order?: number;

  @ApiProperty({
    required: false,
    example: true,
    description:
      'Controla la visibilidad del elemento de navegación. true = visible para los usuarios autorizados. false = oculto.',
  })
  visible?: boolean;

  @ApiProperty({
    required: false,
    example: '30aa6643-de90-4dee-845c-687a31dc781f',
    description:
      'UUID de la aplicación asociada al elemento de navegación. Permite organizar los menús por dominio funcional.',
  })
  application_id?: string;

  @ApiProperty({
    required: false,
    example: 'c4cfca5f-3f63-4d2b-88dd-31cf47bd5f18',
    description:
      'UUID del módulo asociado. Utilizado para construir menús dinámicos basados en Application → Module → Navigation.',
  })
  module_id?: string;

  @ApiProperty({
    required: false,
    description: `
        Actualización parcial de la configuración de navegación.

        La operación permite modificar cualquier propiedad del elemento sin necesidad de enviar el objeto completo.

        Impacto arquitectónico:

        Navigation
        ↓
        Role Modules
        ↓
        Permission Cache
        ↓
        JWT
        ↓
        GET /navigation/my-menu
        ↓
        Menú visible del usuario

        Los cambios aplicados afectan la navegación mostrada a los usuarios autorizados en la plataforma.
        `,
  })
  placeholder?: string;
}
