import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { email, isActive: true },
            relations: ['role'],
        });

        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        const { password: _, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Update last login
        await this.userRepository.update(user.id, {
            lastLogin: new Date(),
        });

        // Payload minimalista - solo el ID del usuario
        // No incluir email, roleId ni roleName para evitar exposición de datos sensibles
        const payload = {
            sub: user.id,
        };

        const accessToken = this.jwtService.sign(payload);

        // Solo devolver el token - los datos del usuario se obtienen vía /auth/profile
        return {
            accessToken,
        };
    }

    async getProfile(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        // Devolver solo los datos necesarios, sin información sensible
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.name,
        };
    }

    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}
