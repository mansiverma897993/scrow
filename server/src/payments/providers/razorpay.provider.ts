import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { ContractEntity } from '../../entities/contract.entity';
import {
  PaymentProvider,
  RazorpayAuthorizationResult,
} from './payment-provider.interface';

@Injectable()
export class RazorpayProvider implements PaymentProvider {
  readonly name = 'razorpay' as const;
  private readonly razorpay: Razorpay;

  constructor(private readonly config: ConfigService) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) throw new Error('Missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET');

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createAuthorization(params: { contract: ContractEntity; returnUrl: string }): Promise<RazorpayAuthorizationResult> {
    const { contract } = params;
    const amount = Number(contract.amountMinor);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error('amountMinor must be a safe positive integer for Razorpay');
    }

    const order = await this.razorpay.orders.create({
      amount,
      currency: contract.currency.toUpperCase(),
      receipt: contract.token,
      notes: {
        scrow_contract_id: contract.id,
        scrow_contract_token: contract.token,
      },
      // Authorized-only: we will capture after approve.
      payment_capture: 0,
    });

    if (!order.id) throw new Error('Razorpay did not return an order id');
    return {
      type: 'razorpay_checkout',
      orderId: order.id,
      keyId: this.config.get<string>('RAZORPAY_KEY_ID')!,
    };
  }

  async capture(params: { contract: ContractEntity }): Promise<void> {
    const { contract } = params;
    if (!contract.razorpayPaymentId) {
      throw new Error('razorpayPaymentId is required before capture');
    }

    await this.razorpay.payments.capture(contract.razorpayPaymentId);
  }
}

