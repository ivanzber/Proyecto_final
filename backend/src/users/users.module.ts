import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, Role, SubadminArea, Area } from '../entities';

@Module({
    imports: [TypeOrmModule.forFeature([User, Role, SubadminArea, Area])],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
