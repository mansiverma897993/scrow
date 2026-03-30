import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ContractProvider, ContractRole } from '../entities/contract.entity';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // minor units (cents/paise)
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value))
  amountMinor!: string;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @IsOptional()
  @IsString()
  sellerEmail?: string;

  @IsIn(['stripe', 'razorpay'])
  provider!: ContractProvider;

  @IsOptional()
  @IsString()
  // optional reference from the integrator
  referenceId?: string;
}

export class AcceptContractDto {
  @IsIn(['buyer', 'seller'])
  role!: ContractRole;
}

export class PayContractDto {
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

export class SubmitWorkDto {
  @IsOptional()
  @IsString()
  message?: string;
}

