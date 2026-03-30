import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import * as crypto from 'crypto';
import { ContractEntity } from '../entities/contract.entity';
import { ContractsService } from '../contracts/contracts.service';

@Injectable()
export class WebhooksService {
  private readonly stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly contracts: ContractsService,
    @InjectRepository(ContractEntity)
    private readonly contractsRepo: Repository<ContractEntity>,
  ) {
    const stripeSecretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) throw new Error('Missing STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
  }

  async handleStripeWebhook(rawBody: Buffer, signatureHeader: string | undefined): Promise<void> {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    if (!signatureHeader) throw new BadRequestException('Missing Stripe signature header');

    const event = this.stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        const contractId = paymentIntent?.metadata?.scrow_contract_id as string | undefined;
        if (!contractId) return;
        await this.contracts.markFundsLocked({
          contractProvider: 'stripe',
          contractId,
          stripePaymentIntentId: paymentIntent.id,
          lockedAt: new Date((paymentIntent.created ?? Math.floor(Date.now() / 1000)) * 1000),
        });
        return;
      }
      default:
        return;
    }
  }

  async handleRazorpayWebhook(rawBody: Buffer, signatureHeader: string | undefined): Promise<void> {
    const secret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) throw new Error('Missing RAZORPAY_WEBHOOK_SECRET');
    if (!signatureHeader) throw new BadRequestException('Missing Razorpay signature header');

    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expected !== signatureHeader) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    const body = JSON.parse(rawBody.toString('utf8'));
    const eventType = body.event as string;

    // payment_capture: 0 -> we expect payment.authorized before manual capture
    if (eventType !== 'payment.authorized' && eventType !== 'payment.captured') {
      return;
    }

    const payment = body?.payload?.payment?.entity;
    const orderId = payment?.order_id as string | undefined;
    const paymentId = payment?.id as string | undefined;
    if (!orderId || !paymentId) return;

    const contract = await this.contractsRepo.findOne({ where: { razorpayOrderId: orderId } });
    if (!contract) return;

    // Only transition ACTIVE -> FUNDS_LOCKED (ignore captured if already completed).
    if (contract.state !== 'ACTIVE') return;

    await this.contracts.markFundsLocked({
      contractProvider: 'razorpay',
      contractId: contract.id,
      razorpayPaymentId: paymentId,
      lockedAt: (() => {
        const createdAt = payment?.created_at;
        if (typeof createdAt === 'number') return new Date(createdAt * 1000);
        if (typeof createdAt === 'string') {
          const n = Number(createdAt);
          if (Number.isFinite(n)) return new Date(n * 1000);
          const d = new Date(createdAt);
          if (!Number.isNaN(d.getTime())) return d;
        }
        return new Date();
      })(),
    });
  }
}

