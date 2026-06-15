import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointsOfInterestService } from './points-of-interest.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('points')
@Controller('points')
export class PointsOfInterestController {
    constructor(private readonly service: PointsOfInterestService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Crear punto de interés' })
    create(@Body() createDto: any, @GetUser('userId') userId: number, @GetUser('roleName') role: string) {
        return this.service.create(createDto, userId, role);
    }

    @Get()
    @ApiOperation({ summary: 'Listar puntos de interés (público)' })
    findAll(@Query('areaId') areaId?: string, @Query('isVisible') isVisible?: string) {
        const areaIdNum = areaId ? parseInt(areaId, 10) : undefined;
        const isVisibleBool = isVisible !== undefined ? isVisible === 'true' : undefined;
        return this.service.findAll({ areaId: areaIdNum, isVisible: isVisibleBool });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener punto por ID' })
    findOne(@Param('id') id: string) {
        return this.service.findOne(+id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Actualizar punto de interés' })
    update(@Param('id') id: string, @Body() updateDto: any, @GetUser('userId') userId: number, @GetUser('roleName') role: string) {
        return this.service.update(+id, updateDto, userId, role);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Eliminar punto de interés' })
    remove(@Param('id') id: string, @GetUser('userId') userId: number, @GetUser('roleName') role: string) {
        return this.service.remove(+id, userId, role);
    }
}
