import { Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller()
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post('/webhooks/stripe')
  async stripe(@Req() req: Request & { body: Buffer; headers: Record<string, any> }) {
    const signatureHeader = req.headers['stripe-signature'] as string | undefined;
    await this.webhooks.handleStripeWebhook(req.body, signatureHeader);
    return { ok: true };
  }

  @Post('/webhooks/razorpay')
  async razorpay(@Req() req: Request & { body: Buffer; headers: Record<string, any> }) {
    const signatureHeader =
      (req.headers['x-razorpay-signature'] as string | undefined) ??
      (req.headers['X-Razorpay-Signature'] as string | undefined);

    await this.webhooks.handleRazorpayWebhook(req.body, signatureHeader);
    return { ok: true };
  }
}

