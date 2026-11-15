import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    required: false,
    description: `
        DTO reservado para futuras operaciones administrativas de creación de usuarios.

        Actualmente el aprovisionamiento principal de usuarios se realiza mediante:

        Google OAuth
        ↓
        Supabase Authentication
        ↓
        User Profile
        ↓
        User Roles
        ↓
        Permission Cache
        ↓
        JWT

        Este DTO permanece disponible para soportar futuras funcionalidades como:

        - Alta manual de usuarios
        - Importación masiva
        - Integraciones corporativas
        - Provisionamiento administrativo
        - Sincronización con Identity Providers externos

        Mientras no se definan atributos funcionales, este objeto actúa como marcador de expansión futura dentro de la arquitectura IAM.
        `,
    example: {},
  })
  placeholder?: string;
}
