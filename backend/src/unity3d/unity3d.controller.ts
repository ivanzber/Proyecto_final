import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Unity3DService } from './unity3d.service';

/**
 * ============================================
 * CONTROLADOR PARA INTEGRACIÓN UNITY 3D WEBGL
 * ============================================
 * 
 * Estos endpoints están diseñados para ser consumidos
 * por el modelo 3D de Unity WebGL.
 * 
 * ENDPOINTS DISPONIBLES:
 * - GET /3d/points - Puntos de interés con coordenadas
 * - GET /3d/areas - Áreas del campus con ubicaciones
 * - GET /3d/world - Datos completos del mundo 3D
 * 
 * DOCUMENTACIÓN DE INTEGRACIÓN:
 * Ver: docs/3D_INTEGRATION_GUIDE.md
 */
@ApiTags('3d')
@Controller('3d')
export class Unity3DController {
    constructor(private readonly unity3dService: Unity3DService) { }

    @Get('points')
    @ApiOperation({
        summary: 'Obtener puntos de interés para Unity 3D',
        description: 'Retorna todos los puntos visibles con coordenadas 3D para renderizar en Unity WebGL',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de puntos con coordenadas (x, y, z)',
    })
    getPoints() {
        return this.unity3dService.getPointsForUnity();
    }

    @Get('areas')
    @ApiOperation({
        summary: 'Obtener áreas del campus para Unity 3D',
        description: 'Retorna todas las áreas activas con sus coordenadas para mapeo 3D',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de áreas con coordenadas',
    })
    getAreas() {
        return this.unity3dService.getAreasForUnity();
    }

    @Get('world')
    @ApiOperation({
        summary: 'Obtener datos completos del mundo 3D',
        description: 'Retorna puntos, áreas y metadata para inicializar el entorno 3D completo',
    })
    @ApiResponse({
        status: 200,
        description: 'Datos completos para Unity: puntos, áreas y metadata',
    })
    getWorldData() {
        return this.unity3dService.getWorldData();
    }
}
