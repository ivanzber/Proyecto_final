import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { EncryptedLoginDto } from './dto/encrypted-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { decryptLoginCredentials } from './utils/crypto.util';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

    @Post('login')
    @ApiOperation({ summary: 'Iniciar sesión (credenciales cifradas)' })
    @ApiResponse({ status: 200, description: 'Login exitoso' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
    async login(@Body() encryptedLoginDto: EncryptedLoginDto) {
        const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

        if (!encryptionKey) {
            throw new UnauthorizedException('Error de configuración del servidor');
        }

        try {
            const credentials = decryptLoginCredentials(
                encryptedLoginDto.payload,
                encryptionKey,
            );

            const loginDto: LoginDto = {
                email: credentials.email,
                password: credentials.password,
            };

            return this.authService.login(loginDto);
        } catch {
            throw new UnauthorizedException('Error al procesar las credenciales');
        }
    }

    /**
     * Endpoint de login en texto plano.
     * ⚠️ SOLO DISPONIBLE EN DESARROLLO (NODE_ENV=development)
     * Úsalo con Postman / Swagger para obtener el token JWT fácilmente.
     */
    @Post('login-dev')
    @ApiOperation({
        summary: '⚙️ Login para desarrollo (solo cuando NODE_ENV=development)',
        description:
            'Acepta email y password en texto plano. ' +
            'Bloqueado automáticamente en producción. ' +
            'Usar solo con Postman o Swagger para pruebas.',
    })
    @ApiResponse({ status: 200, description: 'Login exitoso — devuelve accessToken' })
    @ApiResponse({ status: 403, description: 'No disponible en producción' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
    async loginDev(@Body() loginDto: LoginDto) {
        const env = this.configService.get<string>('NODE_ENV');
        if (env === 'production') {
            throw new ForbiddenException(
                'Este endpoint solo está disponible en modo desarrollo',
            );
        }
        return this.authService.login(loginDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.userId);
    }
}
