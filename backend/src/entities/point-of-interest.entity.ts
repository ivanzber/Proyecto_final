import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Area } from './area.entity';
import { User } from './user.entity';

@Entity('points_of_interest')
export class PointOfInterest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'area_id' })
    areaId: number;

    @ManyToOne(() => Area, area => area.pointsOfInterest, { eager: true })
    @JoinColumn({ name: 'area_id' })
    area: Area;

    @Column({ length: 100, nullable: true })
    category: string;

    @Column({ type: 'json' })
    coordinates: { x: number; y: number; z: number };

    @Column({ name: 'icon_url', length: 500, nullable: true })
    iconUrl: string;

    @Column({ type: 'json', nullable: true })
    images: string[];

    @Column({ name: 'additional_info', type: 'json', nullable: true })
    additionalInfo: Record<string, any>;

    @Column({ name: 'is_visible', default: true })
    isVisible: boolean;

    @Column({ name: 'order_index', default: 0 })
    orderIndex: number;

    @Column({ name: 'created_by' })
    createdBy: number;

    @ManyToOne(() => User, user => user.pointsCreated)
    @JoinColumn({ name: 'created_by' })
    createdByUser: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
