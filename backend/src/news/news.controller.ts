import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('news')
@Controller('news')
export class NewsController {
    constructor(private readonly newsService: NewsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Crear noticia' })
    create(@Body() createDto: any, @GetUser('userId') userId: number) {
        return this.newsService.create(createDto, userId);
    }

    @Get()
    @ApiOperation({ summary: 'Listar noticias (público: solo publicadas)' })
    findAll(@Query('isPublished') isPublished?: boolean, @Query('isFeatured') isFeatured?: boolean) {
        return this.newsService.findAll(isPublished, isFeatured);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener noticia por ID' })
    findOne(@Param('id') id: string) {
        return this.newsService.findOne(+id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Actualizar noticia' })
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.newsService.update(+id, updateDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUBADMIN')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Eliminar noticia' })
    remove(@Param('id') id: string) {
        return this.newsService.remove(+id);
    }
}
