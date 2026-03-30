import { ContractEntity, ContractState } from '../entities/contract.entity';

export type ContractTransition =
  | { from: ContractState; to: 'FUNDS_LOCKED' }
  | { from: ContractState; to: 'WORK_SUBMITTED' }
  | { from: ContractState; to: 'COMPLETED' };

const transitions: ContractTransition[] = [
  { from: 'ACTIVE', to: 'FUNDS_LOCKED' },
  { from: 'FUNDS_LOCKED', to: 'WORK_SUBMITTED' },
  { from: 'WORK_SUBMITTED', to: 'COMPLETED' },
];

export function assertTransition(contract: ContractEntity, to: ContractState): void {
  const allowed = transitions.some((t) => t.from === contract.state && t.to === to);
  if (!allowed) {
    throw new Error(`Invalid contract state transition: ${contract.state} -> ${to}`);
  }
}

