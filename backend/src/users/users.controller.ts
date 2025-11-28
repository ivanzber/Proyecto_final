import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignAreasDto } from './dto/assign-areas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Crear nuevo usuario (solo ADMIN)' })
    @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
    @ApiResponse({ status: 409, description: 'Email ya registrado' })
    create(@Body() createUserDto: CreateUserDto, @GetUser('userId') userId: number) {
        return this.usersService.create(createUserDto, userId);
    }

    @Get()
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Listar todos los usuarios (solo ADMIN)' })
    @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida' })
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @Roles('ADMIN', 'SUBADMIN')
    @ApiOperation({ summary: 'Obtener detalles de un usuario' })
    @ApiResponse({ status: 200, description: 'Usuario encontrado' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(+id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Actualizar usuario (solo ADMIN)' })
    @ApiResponse({ status: 200, description: 'Usuario actualizado' })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(+id, updateUserDto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Eliminar usuario (solo ADMIN)' })
    @ApiResponse({ status: 200, description: 'Usuario eliminado' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(+id);
    }

    @Post(':id/assign-areas')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Asignar áreas a subadministrador (solo ADMIN)' })
    @ApiResponse({ status: 200, description: 'Áreas asignadas correctamente' })
    assignAreas(
        @Param('id') id: string,
        @Body() assignAreasDto: AssignAreasDto,
        @GetUser('userId') userId: number,
    ) {
        return this.usersService.assignAreas(+id, assignAreasDto, userId);
    }

    @Get(':id/areas')
    @Roles('ADMIN', 'SUBADMIN')
    @ApiOperation({ summary: 'Obtener áreas asignadas a un subadministrador' })
    @ApiResponse({ status: 200, description: 'Lista de áreas asignadas' })
    getAssignedAreas(@Param('id') id: string) {
        return this.usersService.getAssignedAreas(+id);
    }
}
