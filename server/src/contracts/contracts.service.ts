import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  ContractEntity,
  ContractProvider,
  ContractRole,
  ContractState,
} from '../entities/contract.entity';
import { ContractEventEntity } from '../entities/contract-event.entity';
import { CreateContractDto, PayContractDto } from './contracts.dto';
import { assertTransition } from './state-machine';
import { PaymentsService } from '../payments/payments.service';

export type DealLinkResult = {
  id: string;
  token: string;
  dealUrl: string;
};

@Injectable()
export class ContractsService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(ContractEntity)
    private readonly contractsRepo: Repository<ContractEntity>,
    @InjectRepository(ContractEventEntity)
    private readonly eventsRepo: Repository<ContractEventEntity>,
    private readonly payments: PaymentsService,
  ) {}

  private async addEvent(contractId: string, eventType: string, payload?: Record<string, unknown>) {
    const e = this.eventsRepo.create({
      contractId,
      eventType,
      payload: payload ?? null,
    });
    await this.eventsRepo.save(e);
  }

  private getAppBaseUrl(): string {
    const baseUrl = this.config.get<string>('APP_BASE_URL');
    if (!baseUrl) throw new Error('Missing APP_BASE_URL');
    return baseUrl.replace(/\/+$/, '');
  }

  async createContract(dto: CreateContractDto): Promise<DealLinkResult & { provider: ContractProvider; amountMinor: string; currency: string; title: string }> {
    const token = uuidv4().replace(/-/g, '');
    const contract = this.contractsRepo.create({
      token,
      title: dto.title,
      description: dto.description ?? null,
      amountMinor: dto.amountMinor,
      currency: dto.currency.toLowerCase(),
      provider: dto.provider,
      state: 'ACTIVE',
      sellerEmail: dto.sellerEmail ?? null,
      buyerEmail: dto.buyerEmail ?? null,
    });
    const saved = await this.contractsRepo.save(contract);
    await this.addEvent(saved.id, 'CONTRACT_CREATED', { token, provider: dto.provider });

    return {
      id: saved.id,
      token: saved.token,
      provider: saved.provider,
      amountMinor: saved.amountMinor,
      currency: saved.currency,
      title: saved.title,
      dealUrl: `${this.getAppBaseUrl()}/deal/${saved.token}`,
    };
  }

  async acceptContract(contractId: string, role: ContractRole): Promise<void> {
    const contract = await this.contractsRepo.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');

    if (contract.state !== 'ACTIVE') {
      throw new BadRequestException(`Cannot accept in state ${contract.state}`);
    }
    if (role !== 'seller') {
      throw new BadRequestException('For MVP, only seller acceptance is supported');
    }
    if (contract.sellerAcceptedAt) return; // idempotent

    contract.sellerAcceptedAt = new Date();
    await this.contractsRepo.save(contract);
    await this.addEvent(contract.id, 'SELLER_ACCEPTED', { role });
  }

  async payContract(contractId: string, dto: PayContractDto): Promise<unknown> {
    const contract = await this.contractsRepo.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.state !== 'ACTIVE') {
      throw new BadRequestException(`Cannot pay in state ${contract.state}`);
    }
    if (!contract.sellerAcceptedAt) {
      throw new BadRequestException('Seller must accept before payment');
    }

    const returnUrl = dto.returnUrl ?? `${this.getAppBaseUrl()}/deal/${contract.token}`;

    const auth = await this.payments.createAuthorization({
      contract,
      returnUrl,
    });

    if (contract.provider === 'stripe' && auth.type === 'stripe_redirect') {
      contract.stripeCheckoutSessionId = auth.checkoutSessionId;
    }
    if (contract.provider === 'razorpay' && auth.type === 'razorpay_checkout') {
      contract.razorpayOrderId = auth.orderId;
    }
    await this.contractsRepo.save(contract);
    await this.addEvent(contract.id, 'PAYMENT_INITIATED', { provider: contract.provider });
    return auth.checkout;
  }

  async submitWork(contractId: string, message?: string): Promise<void> {
    const contract = await this.contractsRepo.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.state !== 'FUNDS_LOCKED') {
      throw new BadRequestException(`Cannot submit work in state ${contract.state}`);
    }

    if (contract.workSubmittedAt) return; // idempotent
    contract.workSubmittedAt = new Date();
    assertTransition(contract, 'WORK_SUBMITTED');
    contract.state = 'WORK_SUBMITTED';

    await this.contractsRepo.save(contract);
    await this.addEvent(contract.id, 'WORK_SUBMITTED', { message: message ?? null });
  }

  async approve(contractId: string): Promise<void> {
    const contract = await this.contractsRepo.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');

    if (contract.state !== 'WORK_SUBMITTED') {
      throw new BadRequestException(`Cannot approve in state ${contract.state}`);
    }
    if (!contract.fundsLockedAt) {
      throw new BadRequestException('Cannot approve contract before funds are locked');
    }
    if (contract.completedAt) return; // idempotent

    await this.payments.capture({ contract });

    assertTransition(contract, 'COMPLETED');
    contract.state = 'COMPLETED';
    contract.completedAt = new Date();
    await this.contractsRepo.save(contract);
    await this.addEvent(contract.id, 'CONTRACT_COMPLETED', {});
  }

  async getById(contractId: string): Promise<ContractEntity> {
    const c = await this.contractsRepo.findOne({ where: { id: contractId } });
    if (!c) throw new NotFoundException('Contract not found');
    return c;
  }

  async getByToken(token: string): Promise<ContractEntity> {
    const c = await this.contractsRepo.findOne({ where: { token } });
    if (!c) throw new NotFoundException('Deal not found');
    return c;
  }

  async markFundsLocked(params: {
    contractProvider: ContractProvider;
    stripePaymentIntentId?: string;
    razorpayPaymentId?: string;
    contractId: string;
    lockedAt: Date;
  }): Promise<void> {
    const contract = await this.contractsRepo.findOne({ where: { id: params.contractId } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.state !== 'ACTIVE') return; // idempotent / ignore duplicates

    assertTransition(contract, 'FUNDS_LOCKED');
    contract.state = 'FUNDS_LOCKED';
    contract.fundsLockedAt = params.lockedAt;

    if (params.contractProvider === 'stripe' && params.stripePaymentIntentId) {
      contract.stripePaymentIntentId = params.stripePaymentIntentId;
    }
    if (params.contractProvider === 'razorpay' && params.razorpayPaymentId) {
      contract.razorpayPaymentId = params.razorpayPaymentId;
    }

    await this.contractsRepo.save(contract);
    await this.addEvent(contract.id, 'FUNDS_LOCKED', {
      provider: params.contractProvider,
      stripePaymentIntentId: params.stripePaymentIntentId ?? null,
      razorpayPaymentId: params.razorpayPaymentId ?? null,
    });
  }

  async confirmFundsLocked(contractId: string): Promise<void> {
    const contract = await this.contractsRepo.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.state !== 'ACTIVE') {
      // only allow explicit lock from active
      throw new BadRequestException(`Cannot confirm funds locked in state ${contract.state}`);
    }
    if (!contract.sellerAcceptedAt) {
      throw new BadRequestException('Seller must accept contract before locking funds');
    }

    await this.markFundsLocked({
      contractProvider: contract.provider,
      contractId: contract.id,
      lockedAt: new Date(),
    });
  }
}

