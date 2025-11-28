import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['entityType', 'entityId'])
@Index(['createdAt'])
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @ManyToOne(() => User, user => user.auditLogs)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ length: 100 })
    action: string;

    @Column({ name: 'entity_type', length: 100, nullable: true })
    entityType: string;

    @Column({ name: 'entity_id', nullable: true })
    entityId: number;

    @Column({ name: 'old_values', type: 'json', nullable: true })
    oldValues: Record<string, any>;

    @Column({ name: 'new_values', type: 'json', nullable: true })
    newValues: Record<string, any>;

    @Column({ name: 'ip_address', length: 45, nullable: true })
    ipAddress: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
