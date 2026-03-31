import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { ContractEntity } from '../../entities/contract.entity';
import { PaymentProvider, StripeAuthorizationResult } from './payment-provider.interface';

@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe' as const;

  private readonly stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) throw new Error('Missing STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
  }

  async createAuthorization(params: {
    contract: ContractEntity;
    returnUrl: string;
  }): Promise<StripeAuthorizationResult> {
    const { contract, returnUrl } = params;
    const amount = Number(contract.amountMinor);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error('amountMinor must be a safe positive integer for Stripe');
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      // You can expand supported payment methods later.
      line_items: [
        {
          price_data: {
            currency: contract.currency,
            product_data: { name: contract.title },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        capture_method: 'manual',
        metadata: {
          scrow_contract_id: contract.id,
          scrow_contract_token: contract.token,
        },
      },
      // Hosted flow in this MVP: integrator gets redirected to Stripe Checkout.
      success_url: `${returnUrl}?scrow=stripe_success`,
      cancel_url: `${returnUrl}?scrow=stripe_cancel`,
    });

    if (!session.id || !session.url) throw new Error('Stripe did not return a session id/url');
    return {
      type: 'stripe_redirect',
      checkoutSessionId: session.id,
      checkoutSessionUrl: session.url,
    };
  }

  async capture(params: { contract: ContractEntity }): Promise<void> {
    const { contract } = params;
    if (!contract.stripePaymentIntentId) {
      throw new Error('stripePaymentIntentId is required before capture');
    }
    await this.stripe.paymentIntents.capture(contract.stripePaymentIntentId);
  }
}

