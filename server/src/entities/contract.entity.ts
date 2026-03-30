import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ContractProvider = 'stripe' | 'razorpay';
export type ContractState = 'ACTIVE' | 'FUNDS_LOCKED' | 'WORK_SUBMITTED' | 'COMPLETED';
export type ContractRole = 'buyer' | 'seller';

@Entity({ name: 'contracts' })
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  token!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  // Stored in minor units (cents/paise).
  @Column({ type: 'bigint' })
  amountMinor!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: string;

  @Column({ type: 'varchar', length: 12 })
  provider!: ContractProvider;

  @Column({ type: 'varchar', length: 32 })
  state!: ContractState;

  @Column({ type: 'timestamptz', nullable: true })
  sellerAcceptedAt?: Date | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  buyerEmail?: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  sellerEmail?: string | null;

  // Stripe fields (manual capture)
  @Column({ type: 'varchar', length: 200, nullable: true })
  stripeCheckoutSessionId?: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripePaymentIntentId?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  fundsLockedAt?: Date | null;

  // Razorpay fields (authorized-only)
  @Column({ type: 'varchar', length: 200, nullable: true })
  razorpayOrderId?: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  razorpayPaymentId?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  workSubmittedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

