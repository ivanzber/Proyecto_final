import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, IsObject } from 'class-validator';

export class CreateAreaDto {
    @ApiProperty({ example: 'Facultad de Ingeniería' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'FAC_ING' })
    @IsString()
    code: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsInt()
    @IsOptional()
    parentAreaId?: number;

    @ApiProperty({ required: false, example: { x: 100, y: 0, z: 50 } })
    @IsObject()
    @IsOptional()
    coordinates?: { x: number; y: number; z: number };

    @ApiProperty({ required: false })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
