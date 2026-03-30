import { Injectable } from '@nestjs/common';
import { ContractEntity } from '../entities/contract.entity';
import { StripeProvider } from './providers/stripe.provider';
import { RazorpayProvider } from './providers/razorpay.provider';
import { AuthorizationResult, PaymentProvider } from './providers/payment-provider.interface';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly stripeProvider: StripeProvider,
    private readonly razorpayProvider: RazorpayProvider,
  ) {}

  private getProvider(contract: ContractEntity): PaymentProvider {
    if (contract.provider === 'stripe') return this.stripeProvider;
    if (contract.provider === 'razorpay') return this.razorpayProvider;
    throw new Error(`Unsupported provider: ${(contract as any).provider}`);
  }

  async createAuthorization(params: {
    contract: ContractEntity;
    returnUrl: string;
  }): Promise<{ type: 'stripe_redirect' | 'razorpay_checkout'; checkoutSessionId?: string; orderId?: string; checkout: unknown }> {
    const { contract, returnUrl } = params;
    const provider = this.getProvider(contract);
    const auth: AuthorizationResult = await provider.createAuthorization({ contract, returnUrl });

    if (auth.type === 'stripe_redirect') {
      return {
        type: 'stripe_redirect',
        checkoutSessionId: auth.checkoutSessionId,
        checkout: {
          provider: 'stripe',
          checkoutSessionId: auth.checkoutSessionId,
          redirectUrl: auth.checkoutSessionUrl,
        },
      };
    }

    // razorpay
    return {
      type: 'razorpay_checkout',
      orderId: auth.orderId,
      checkout: {
        provider: 'razorpay',
        orderId: auth.orderId,
        keyId: auth.keyId,
        currency: contract.currency,
        amountMinor: contract.amountMinor,
        // Client will open Razorpay Checkout with these.
      },
    };
  }

  async capture(params: { contract: ContractEntity }): Promise<void> {
    const { contract } = params;
    const provider = this.getProvider(contract);
    await provider.capture({ contract });
  }
}

