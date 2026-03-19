import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Role } from './role.entity';
import { SubadminArea } from './subadmin-area.entity';
import { PointOfInterest } from './point-of-interest.entity';
import { Event } from './event.entity';
import { News } from './news.entity';
import { AuditLog } from './audit-log.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255, unique: true })
    email: string;

    @Column({ length: 255 })
    @Exclude()
    password: string;

    @Column({ name: 'first_name', length: 100 })
    firstName: string;

    @Column({ name: 'last_name', length: 100 })
    lastName: string;

    @Column({ name: 'role_id' })
    roleId: number;

    @ManyToOne(() => Role, role => role.users, { eager: true })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'last_login', type: 'timestamp', nullable: true })
    lastLogin: Date;

    @OneToMany(() => SubadminArea, subadminArea => subadminArea.user)
    assignedAreas: SubadminArea[];

    @OneToMany(() => PointOfInterest, point => point.createdByUser)
    pointsCreated: PointOfInterest[];

    @OneToMany(() => Event, event => event.createdByUser)
    eventsCreated: Event[];

    @OneToMany(() => News, news => news.createdByUser)
    newsCreated: News[];

    @OneToMany(() => AuditLog, log => log.user)
    auditLogs: AuditLog[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
