import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { PortfolioPosition } from './portfolio-position.entity';

@Entity('portfolios')
@Index(['user'])
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.portfolios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'total_invested', default: 0 })
  totalInvested: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'current_value', default: 0 })
  currentValue: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  profit: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'profit_percentage', default: 0 })
  profitPercentage: number;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PortfolioPosition, (position) => position.portfolio)
  positions: PortfolioPosition[];
}
