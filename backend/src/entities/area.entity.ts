import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PointOfInterest } from './point-of-interest.entity';

@Entity('areas')
export class Area {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 200 })
    name: string;

    @Column({ length: 50, unique: true })
    code: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'parent_area_id', nullable: true })
    parentAreaId: number;

    @ManyToOne(() => Area, area => area.childAreas, { nullable: true })
    @JoinColumn({ name: 'parent_area_id' })
    parentArea: Area;

    @OneToMany(() => Area, area => area.parentArea)
    childAreas: Area[];

    @Column({ type: 'json', nullable: true })
    coordinates: { x: number; y: number; z: number };

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => PointOfInterest, point => point.area)
    pointsOfInterest: PointOfInterest[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
