import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Crear evento' })
    create(@Body() createDto: any, @GetUser('userId') userId: number) {
        return this.eventsService.create(createDto, userId);
    }

    @Get()
    @ApiOperation({ summary: 'Listar eventos (público: solo publicados)' })
    findAll(@Query('isPublished') isPublished?: boolean) {
        return this.eventsService.findAll(isPublished);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener evento por ID' })
    findOne(@Param('id') id: string) {
        return this.eventsService.findOne(+id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Actualizar evento' })
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
