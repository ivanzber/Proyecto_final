import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Area } from './area.entity';

@Entity('subadmin_areas')
export class SubadminArea {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @ManyToOne(() => User, user => user.assignedAreas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'area_id' })
    areaId: number;

    @ManyToOne(() => Area, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'area_id' })
    area: Area;

    @Column({ name: 'assigned_by' })
    assignedBy: number;

    @ManyToOne(() => User, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'assigned_by' })
    assignedByUser: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
