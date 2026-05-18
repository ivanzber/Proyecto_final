import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix(process.env.API_PREFIX || 'api');

    // ── CORS abierto para la exposición ──────────────────
    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
    });

    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: false,
    }));

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));

    app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector))
    );

    const config = new DocumentBuilder()
        .setTitle('Campus Virtual UDEC API')
        .setDescription('API REST para el sistema de recorrido virtual')
        .setVersion('1.0')
        .addBearerAuth({
            type: 'http', scheme: 'bearer', bearerFormat: 'JWT',
            name: 'Authorization', in: 'header',
        }, 'JWT-auth')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 8080;
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Backend corriendo en puerto ${port}`);
    console.log(`📚 Docs: http://localhost:${port}/api/docs`);
}

bootstrap();