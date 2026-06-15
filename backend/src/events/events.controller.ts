import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe, ParseBoolPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Crear evento (valida conflictos de horario)' })
    create(@Body() createDto: any, @GetUser('userId') userId: number) {
        return this.eventsService.create(createDto, userId);
    }

    @Get()
    @ApiOperation({ summary: 'Listar eventos activos (excluye pasados automáticamente)' })
    findAll(
        @Query('isPublished') isPublished?: string,
        @Query('pointOfInterestId') pointOfInterestId?: string,
        @Query('areaId') areaId?: string,
        @Query('poiAreaId') poiAreaId?: string,
    ) {
        const pub = isPublished !== undefined ? isPublished === 'true' : undefined;
        const poiId = pointOfInterestId ? parseInt(pointOfInterestId, 10) : undefined;
        const aId = areaId ? parseInt(areaId, 10) : undefined;
        const pAreaId = poiAreaId ? parseInt(poiAreaId, 10) : undefined;
        return this.eventsService.findAll(pub, poiId, aId, pAreaId);
    }

    @Get('admin/all')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Listar TODOS los eventos incluyendo pasados (admin)' })
    findAllAdmin(
        @Query('pointOfInterestId') pointOfInterestId?: string,
        @Query('areaId') areaId?: string,
    ) {
        const poiId = pointOfInterestId ? parseInt(pointOfInterestId, 10) : undefined;
        const aId = areaId ? parseInt(areaId, 10) : undefined;
        return this.eventsService.findAllAdmin(poiId, aId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener evento por ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.eventsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Actualizar evento (valida conflictos)' })
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.eventsService.update(+id, updateDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Eliminar evento' })
    remove(@Param('id') id: string) {
        return this.eventsService.remove(+id);
    }
}