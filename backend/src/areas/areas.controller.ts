import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('areas')
@Controller('areas')
export class AreasController {
    constructor(private readonly areasService: AreasService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Crear área (solo ADMIN)' })
    create(@Body() createAreaDto: CreateAreaDto) {
        return this.areasService.create(createAreaDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas las áreas (público)' })
    findAll() {
        return this.areasService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener área por ID (público)' })
    findOne(@Param('id') id: string) {
        return this.areasService.findOne(+id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Actualizar área (solo ADMIN)' })
    update(@Param('id') id: string, @Body() updateAreaDto: UpdateAreaDto) {
        return this.areasService.update(+id, updateAreaDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Eliminar área (solo ADMIN)' })
    remove(@Param('id') id: string) {
        return this.areasService.remove(+id);
    }
}
