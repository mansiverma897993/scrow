import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ContractsService } from './contracts.service';
import { AcceptContractDto, CreateContractDto, PayContractDto, SubmitWorkDto } from './contracts.dto';

@UseGuards(ApiKeyGuard)
@Controller()
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Post('/contracts')
  async createContract(@Body() dto: CreateContractDto) {
    return this.contracts.createContract(dto);
  }

  @Post('/contracts/:id/accept')
  async acceptContract(@Param('id') id: string, @Body() dto: AcceptContractDto) {
    await this.contracts.acceptContract(id, dto.role);
    return { ok: true };
  }

  @Post('/contracts/:id/pay')
  async payContract(@Param('id') id: string, @Body() dto: PayContractDto) {
    return this.contracts.payContract(id, dto);
  }

  @Post('/contracts/:id/submit')
  async submitWork(@Param('id') id: string, @Body() dto: SubmitWorkDto) {
    await this.contracts.submitWork(id, dto.message);
    return { ok: true };
  }

  @Post('/contracts/:id/approve')
  async approve(@Param('id') id: string) {
    await this.contracts.approve(id);
    return { ok: true };
  }

  @Get('/contracts/:id')
  async getById(@Param('id') id: string) {
    const c = await this.contracts.getById(id);
    return this.serializeContract(c);
  }

  @Get('/contracts/by-token/:token')
  async getByToken(@Param('token') token: string) {
    const c = await this.contracts.getByToken(token);
    return this.serializeContract(c);
  }

  private serializeContract(c: any) {
    // Keep response shape stable for SDK/hosted flow.
    return {
      id: c.id,
      token: c.token,
      title: c.title,
      description: c.description,
      amountMinor: c.amountMinor,
      currency: c.currency,
      provider: c.provider,
      state: c.state,
      sellerAcceptedAt: c.sellerAcceptedAt,
      fundsLockedAt: c.fundsLockedAt,
      workSubmittedAt: c.workSubmittedAt,
      completedAt: c.completedAt,
      stripeCheckoutSessionId: c.stripeCheckoutSessionId,
      stripePaymentIntentId: c.stripePaymentIntentId,
      razorpayOrderId: c.razorpayOrderId,
      razorpayPaymentId: c.razorpayPaymentId,
    };
  }
}

