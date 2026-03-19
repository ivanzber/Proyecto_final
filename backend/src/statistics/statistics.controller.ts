import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @Post('track')
    @ApiOperation({ summary: 'Registrar evento de estadística (público)' })
    track(@Body() trackDto: any) {
        return this.statisticsService.track(trackDto);
    }

    @Get('dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener métricas del dashboard (solo ADMIN)' })
    getDashboard() {
        return this.statisticsService.getDashboard();
    }

    @Get('areas/most-visited')
    @ApiOperation({ summary: 'Obtener áreas más visitadas' })
    getMostVisitedAreas(@Query('limit') limit?: number) {
        return this.statisticsService.getMostVisitedAreas(limit || 10);
    }

    @Get('visits-by-date')
    @ApiOperation({ summary: 'Obtener visitas por fecha' })
    getVisitsByDate(@Query('days') days?: number) {
        return this.statisticsService.getVisitsByDate(days || 30);
    }

    @Get('points/popular')
    @ApiOperation({ summary: 'Obtener puntos de interés más populares' })
    getPopularPoints(@Query('limit') limit?: number) {
        return this.statisticsService.getPopularPoints(limit || 10);
    }

    @Get('recent')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener actividad reciente (solo ADMIN)' })
    getRecent(@Query('limit') limit?: number) {
        return this.statisticsService.getRecentActivity(limit);
    }
}
