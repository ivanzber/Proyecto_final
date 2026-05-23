import { Expose, Type } from 'class-transformer';

export class RoleResponseDto {
    @Expose()
    id: number;

    @Expose()
    name: string;
}

/**
 * DTO de respuesta para usuarios.
 * Solo expone los campos necesarios para la gestión admin,
 * sin datos sensibles innecesarios.
 */
export class UserResponseDto {
    @Expose()
    id: number;

    @Expose()
    email: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    isActive: boolean;

    @Expose()
    lastLogin: Date;

    @Expose()
    createdAt: Date;

    @Expose()
    @Type(() => RoleResponseDto)
    role: RoleResponseDto;

    // roleId, updatedAt, password, assignedAreas, pointsCreated,
    // eventsCreated, newsCreated, auditLogs — NO se exponen
}
