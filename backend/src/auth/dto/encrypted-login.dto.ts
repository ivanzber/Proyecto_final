import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EncryptedLoginDto {
    @ApiProperty({
        description: 'Credenciales cifradas con AES-256-CBC (Base64: IV + encrypted data)',
        example: 'U2FsdGVkX1+abc123...',
    })
    @IsString({ message: 'El payload debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El payload cifrado es requerido' })
    payload: string;
}
