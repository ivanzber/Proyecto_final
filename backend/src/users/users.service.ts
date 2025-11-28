import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Role, SubadminArea, Area } from '../entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignAreasDto } from './dto/assign-areas.dto';

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
    ) { }

    async create(createUserDto: CreateUserDto, createdBy: number) {
        // Verificar si el email ya existe
        const existing = await this.userRepository.findOne({
            where: { email: createUserDto.email },
        });

        if (existing) {
            throw new ConflictException('El email ya está registrado');
        }

        // Verificar que el rol existe
        const role = await this.roleRepository.findOne({
            where: { id: createUserDto.roleId },
        });

        if (!role) {
            throw new NotFoundException('Rol no encontrado');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);
        const { password, ...result } = savedUser;

        return result;
    }

    async findAll() {
        const users = await this.userRepository.find({
            relations: ['role'],
            order: { createdAt: 'DESC' },
        });

        return users.map(user => {
            const { password, ...result } = user;
            return result;
        });
    }

    async findOne(id: number) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['role', 'assignedAreas', 'assignedAreas.area'],
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const { password, ...result } = user;
        return result;
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        const user = await this.findOne(id);

        // Si se actualiza el email, verificar que no exista
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existing = await this.userRepository.findOne({
                where: { email: updateUserDto.email },
            });

            if (existing) {
                throw new ConflictException('El email ya está registrado');
            }
        }

        // Si se actualiza la contraseña, hashearla
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        await this.userRepository.update(id, updateUserDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        const user = await this.findOne(id);
        await this.userRepository.softDelete(id);
        return { message: 'Usuario eliminado correctamente' };
    }

    async assignAreas(userId: number, assignAreasDto: AssignAreasDto, assignedBy: number) {
        const user = await this.findOne(userId);

        // Verificar que el usuario es SUBADMIN
        if (user.role.name !== 'SUBADMIN') {
            throw new ForbiddenException('Solo se pueden asignar áreas a subadministradores');
        }

        // Eliminar asignaciones anteriores
        await this.subadminAreaRepository.delete({ userId });

        // Crear nuevas asignaciones
        const assignments = assignAreasDto.areaIds.map(areaId =>
            this.subadminAreaRepository.create({
                userId,
                areaId,
                assignedBy,
            })
        );

        await this.subadminAreaRepository.save(assignments);

        return this.findOne(userId);
    }

    async getAssignedAreas(userId: number) {
        const assignments = await this.subadminAreaRepository.find({
            where: { userId },
            relations: ['area'],
        });

        return assignments.map(a => a.area);
    }
}
