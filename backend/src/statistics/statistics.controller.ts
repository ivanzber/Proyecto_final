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

    @Get('recent')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener actividad reciente (solo ADMIN)' })
    getRecent(@Query('limit') limit?: number) {
        return this.statisticsService.getRecentActivity(limit);
    }
}
