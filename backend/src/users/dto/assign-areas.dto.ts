import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class AssignAreasDto {
    @ApiProperty({
        description: 'Array de IDs de áreas a asignar',
        example: [1, 2, 3],
        type: [Number],
    })
    @IsArray()
    @IsInt({ each: true })
    @ArrayMinSize(1)
    areaIds: number[];
}
