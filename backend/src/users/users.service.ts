import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { User, Role, SubadminArea, Area } from '../entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignAreasDto } from './dto/assign-areas.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(SubadminArea)
        private readonly subadminAreaRepository: Repository<SubadminArea>,
        @InjectRepository(Area)
        private readonly areaRepository: Repository<Area>,
        private readonly dataSource: DataSource,
    ) { }

    // ── Helper: serializar usuario con DTO ────────────────────
    private toResponse(user: User): UserResponseDto {
        return plainToInstance(UserResponseDto, user, {
            excludeExtraneousValues: true,
        });
    }

    // ── Crear usuario ─────────────────────────────────────────
    async create(createUserDto: CreateUserDto, createdBy: number) {
        const existing = await this.userRepository.findOne({
            where: { email: createUserDto.email },
        });
        if (existing) {
            throw new ConflictException('El email ya está registrado');
        }

        const role = await this.roleRepository.findOne({
            where: { id: createUserDto.roleId },
        });
        if (!role) {
            throw new NotFoundException('Rol no encontrado');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);
        // Recargar con relaciones para devolver la respuesta correcta
        const withRelations = await this.userRepository.findOne({
            where: { id: savedUser.id },
            relations: ['role'],
        });
        return this.toResponse(withRelations!);
    }

    // ── Listar todos ──────────────────────────────────────────
    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.userRepository.find({
            relations: ['role'],
            order: { createdAt: 'DESC' },
        });
        return users.map(user => this.toResponse(user));
    }

    // ── Obtener uno (raw, para uso interno del servicio) ─────
    private async findOneRaw(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['role', 'assignedAreas', 'assignedAreas.area'],
        });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }
        return user;
    }

    // ── Obtener uno (respuesta pública) ──────────────────────
    async findOne(id: number): Promise<UserResponseDto> {
        const user = await this.findOneRaw(id);
        return this.toResponse(user);
    }

    // ── Actualizar ────────────────────────────────────────────
    async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
        const user = await this.findOneRaw(id);

        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existing = await this.userRepository.findOne({
                where: { email: updateUserDto.email },
            });
            if (existing) {
                throw new ConflictException('El email ya está registrado');
            }
        }

        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        await this.userRepository.update(id, updateUserDto);
        return this.findOne(id);
    }

    // ── Eliminar usuario ──────────────────────────────────────
    async remove(id: number, requesterId?: number) {
        // Verificar que existe
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // No puede eliminarse a sí mismo
        if (requesterId && id === requesterId) {
            throw new ConflictException('No puedes eliminar tu propia cuenta');
        }

        try {
            // 1. Eliminar áreas asignadas al subadmin
            await this.subadminAreaRepository.delete({ userId: id });

            // 2. Poner NULL en eventos creados por este usuario
            await this.dataSource.query(
                `UPDATE events SET created_by = NULL WHERE created_by = ?`,
                [id]
            );

            // 3. Poner NULL en noticias creadas por este usuario
            await this.dataSource.query(
                `UPDATE news SET created_by = NULL WHERE created_by = ?`,
                [id]
            );

            // 4. Eliminar estadísticas del usuario
            await this.dataSource.query(
                `DELETE FROM statistics WHERE session_id LIKE ?`,
                [`%_${id}_%`]
            );

            // 5. Eliminar el usuario
            await this.userRepository.delete(id);

            return { message: 'Usuario eliminado correctamente' };

        } catch (err: any) {
            console.error('❌ Error eliminando usuario:', err.message);
            throw new ConflictException(
                `No se pudo eliminar el usuario: ${err.message}`
            );
        }
    }

    // ── Asignar áreas a subadmin ──────────────────────────────
    async assignAreas(
        userId: number,
        assignAreasDto: AssignAreasDto,
        assignedBy: number,
    ): Promise<UserResponseDto> {
        const user = await this.findOneRaw(userId);

        if (user.role.name !== 'SUBADMIN') {
            throw new ForbiddenException(
                'Solo se pueden asignar áreas a subadministradores'
            );
        }

        // Eliminar asignaciones anteriores
        await this.subadminAreaRepository.delete({ userId });

        // Crear nuevas asignaciones
        if (assignAreasDto.areaIds.length > 0) {
            const assignments = assignAreasDto.areaIds.map(areaId =>
                this.subadminAreaRepository.create({
                    userId,
                    areaId,
                    assignedBy,
                })
            );
            await this.subadminAreaRepository.save(assignments);
        }

        return this.findOne(userId);
    }

    // ── Obtener áreas asignadas ───────────────────────────────
    async getAssignedAreas(userId: number) {
        const assignments = await this.subadminAreaRepository.find({
            where: { userId },
            relations: ['area'],
        });
        return assignments.map(a => a.area);
    }
}