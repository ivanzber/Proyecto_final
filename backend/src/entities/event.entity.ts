import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Area } from './area.entity';
import { User } from './user.entity';
import { PointOfInterest } from './point-of-interest.entity';

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'area_id', nullable: true })
    areaId: number;

    @ManyToOne(() => Area, { nullable: true })
    @JoinColumn({ name: 'area_id' })
    area: Area;

    @Column({ name: 'point_of_interest_id', nullable: true })
    pointOfInterestId: number;

    @ManyToOne(() => PointOfInterest, { nullable: true })
    @JoinColumn({ name: 'point_of_interest_id' })
    pointOfInterest: PointOfInterest;

    @Column({ name: 'event_date', type: 'date' })
    eventDate: Date;

    @Column({ name: 'start_time', type: 'time', nullable: true })
    startTime: string;

    @Column({ name: 'end_time', type: 'time', nullable: true })
    endTime: string;

    @Column({ length: 255, nullable: true })
    location: string;

    @Column({ name: 'image_url', length: 500, nullable: true })
    imageUrl: string;

    @Column({ length: 100, nullable: true })
    category: string;

    @Column({ name: 'is_published', default: false })
    isPublished: boolean;

    @Column({ name: 'created_by' })
    createdBy: number;

    @ManyToOne(() => User, user => user.eventsCreated)
    @JoinColumn({ name: 'created_by' })
    createdByUser: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
