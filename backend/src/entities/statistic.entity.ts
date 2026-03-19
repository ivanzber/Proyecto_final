import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('statistics')
@Index(['eventType'])
@Index(['entityType', 'entityId'])
@Index(['createdAt'])
export class Statistic {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'event_type', length: 100 })
    eventType: string;

    @Column({ name: 'entity_type', length: 100, nullable: true })
    entityType: string;

    @Column({ name: 'entity_id', nullable: true })
    entityId: number;

    @Column({ name: 'user_id', nullable: true })
    userId: number;

    @Column({ name: 'session_id', length: 255, nullable: true })
    sessionId: string;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>;

    @Column({ name: 'ip_address', length: 45, nullable: true })
    ipAddress: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
