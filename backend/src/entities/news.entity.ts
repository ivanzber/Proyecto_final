import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Area } from './area.entity';
import { User } from './user.entity';

@Entity('news')
export class News {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    title: string;

    @Column({ length: 500, nullable: true })
    summary: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'area_id', nullable: true })
    areaId: number;

    @ManyToOne(() => Area, { nullable: true })
    @JoinColumn({ name: 'area_id' })
    area: Area;

    @Column({ name: 'featured_image', length: 500, nullable: true })
    featuredImage: string;

    @Column({ length: 100, nullable: true })
    category: string;

    @Column({ name: 'is_published', default: false })
    isPublished: boolean;

    @Column({ name: 'is_featured', default: false })
    isFeatured: boolean;

    @Column({ name: 'publish_date', type: 'timestamp', nullable: true })
    publishDate: Date;

    @Column({ name: 'created_by' })
    createdBy: number;

    @ManyToOne(() => User, user => user.newsCreated)
    @JoinColumn({ name: 'created_by' })
    createdByUser: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
