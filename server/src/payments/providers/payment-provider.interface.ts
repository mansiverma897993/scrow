import { ContractEntity } from '../../entities/contract.entity';

export type StripeAuthorizationResult =
  | { type: 'stripe_redirect'; checkoutSessionId: string; checkoutSessionUrl: string };

export type RazorpayAuthorizationResult = { type: 'razorpay_checkout'; orderId: string; keyId: string };

export type AuthorizationResult = StripeAuthorizationResult | RazorpayAuthorizationResult;

export interface PaymentProvider {
  readonly name: 'stripe' | 'razorpay';

  createAuthorization(params: {
    contract: ContractEntity;
    returnUrl: string;
  }): Promise<AuthorizationResult>;

  capture(params: { contract: ContractEntity }): Promise<void>;
}

