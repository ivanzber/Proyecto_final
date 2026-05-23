import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix
    app.setGlobalPrefix(process.env.API_PREFIX || 'api');

    // CORS
    app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
        credentials: true,
    });

    // Security headers
    app.use(helmet());

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global interceptor for class serialization (excludes password fields, etc.)
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    // Swagger API Documentation
    const config = new DocumentBuilder()
        .setTitle('Campus Virtual UDEC API')
        .setDescription(
            'API REST para el sistema de recorrido virtual del Campus Universidad de Cundinamarca - Extensión Facatativá',
        )
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'Ingrese su token JWT',
                in: 'header',
            },
            'JWT-auth',
        )
        .addTag('auth', 'Autenticación y autorización')
        .addTag('users', 'Gestión de usuarios')
        .addTag('areas', 'Áreas del campus')
        .addTag('points', 'Puntos de interés')
        .addTag('events', 'Eventos institucionales')
        .addTag('news', 'Noticias y anuncios')
        .addTag('statistics', 'Estadísticas y métricas')
        .addTag('3d', 'Integración con modelo 3D Unity WebGL')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'Campus Virtual UDEC - API Docs',
        customCss: '.swagger-ui .topbar { display: none }',
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   🎓 Campus Virtual UDEC - API Backend                   ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║   🚀 Server running on: http://localhost:${port}          ║`);
    console.log(`║   📚 API Documentation: http://localhost:${port}/api/docs ║`);
    console.log(`║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                      ║`);
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
}

bootstrap();
