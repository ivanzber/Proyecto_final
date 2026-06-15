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

    // ── Público — tracking desde Unity/React ──────────────────────
    @Post('track')
    @ApiOperation({ summary: 'Registrar visita a POI (público)' })
    track(@Body() trackDto: any) {
        return this.statisticsService.track(trackDto);
    }

    // ── Protegidos — solo ADMIN ───────────────────────────────────
    @Get('dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    getDashboard() {
        return this.statisticsService.getDashboard();
    }

    @Get('areas/most-visited')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener áreas más visitadas' })
    getMostVisitedAreas(@Query('limit') limitStr?: string) {
        const limit = limitStr ? parseInt(limitStr, 10) : undefined;
        return this.statisticsService.getMostVisitedAreas(limit || 8);
    }

    @Get('visits/by-date')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener visitas por fecha (últimos X días)' })
    getVisitsByDate(@Query('days') daysStr?: string) {
        const days = daysStr ? parseInt(daysStr, 10) : undefined;
        return this.statisticsService.getVisitsByDate(days || 7);
    }

    @Get('active-users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    getActiveUsers() {
        return this.statisticsService.getActiveUsers();
    }

    @Get('activity/recent')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener actividad reciente de usuarios' })
    getRecent(@Query('limit') limitStr?: string) {
        const limit = limitStr ? parseInt(limitStr, 10) : undefined;
        return this.statisticsService.getRecentActivity(limit);
    }
    @Post('view')
@ApiOperation({ summary: 'Registrar visualización de evento o noticia (público)' })
trackView(@Body() body: { entityType: 'event' | 'news'; entityId: number; sessionId?: string }) {
    return this.statisticsService.track({
        eventType:  'content_view',
        entityType: body.entityType,
        entityId:   body.entityId,
        sessionId:  body.sessionId,
    });
}

@Get('views/summary')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Resumen de visualizaciones por contenido (ADMIN)' })
getViewsSummary() {
    return this.statisticsService.getViewsSummary();
}
}