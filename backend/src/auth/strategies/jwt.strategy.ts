import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    /**
     * Valida el token JWT consultando la base de datos.
     * Solo recibe 'sub' (userId) del payload, y obtiene los datos actualizados del usuario.
     * Esto garantiza que:
     * - No se exponen datos sensibles en el JWT
     * - Los cambios de rol aplican inmediatamente
     * - Los usuarios desactivados pierden acceso al instante
     */
    async validate(payload: any) {
        const user = await this.userRepository.findOne({
            where: { id: payload.sub, isActive: true },
            relations: ['role'],
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no válido o desactivado');
        }

        return {
            userId: user.id,
            email: user.email,
            roleId: user.roleId,
            roleName: user.role.name,
        };
    }
}
