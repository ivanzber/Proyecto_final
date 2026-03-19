import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'usuario@udec.edu.co' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Password123!', minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'Juan' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Pérez' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 3, description: 'ID del rol (2=ADMIN, 3=SUBADMIN, 1=USER)' })
    @IsInt()
    @IsNotEmpty()
    roleId: number;

    @ApiProperty({ example: true, required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
