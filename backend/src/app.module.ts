import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AreasModule } from './areas/areas.module';
import { PointsOfInterestModule } from './points-of-interest/points-of-interest.module';
import { EventsModule } from './events/events.module';
import { NewsModule } from './news/news.module';
import { StatisticsModule } from './statistics/statistics.module';
import { Unity3DModule } from './unity3d/unity3d.module';
import * as entities from './entities';

@Module({
    imports: [
        // Environment configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Database configuration
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT, 10) || 3306,
            username: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'campus_virtual',
            entities: Object.values(entities),
            synchronize: process.env.NODE_ENV === 'development', // ⚠️ Disable in production
            logging: process.env.NODE_ENV === 'development',
            charset: 'utf8mb4',
            timezone: 'Z',
        }),

        // Rate limiting
        ThrottlerModule.forRoot([{
            ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
            limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
        }]),

        // Feature modules
        AuthModule,
        UsersModule,
        AreasModule,
        PointsOfInterestModule,
        EventsModule,
        NewsModule,
        StatisticsModule,
        Unity3DModule,
    ],
})
export class AppModule { }
