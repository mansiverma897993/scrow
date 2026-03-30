import { Module } from '@nestjs/common';
import { StripeProvider } from './providers/stripe.provider';
import { RazorpayProvider } from './providers/razorpay.provider';
import { PaymentsService } from './payments.service';

@Module({
  providers: [StripeProvider, RazorpayProvider, PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

