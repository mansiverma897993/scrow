export type ContractProvider = 'stripe' | 'razorpay';
export type ContractState = 'ACTIVE' | 'FUNDS_LOCKED' | 'WORK_SUBMITTED' | 'COMPLETED';

export type ScrowDeal = {
  id: string;
  token: string;
  dealUrl: string;
};

export type ContractDetails = {
  id: string;
  token: string;
  title: string;
  description?: string | null;
  amountMinor: string;
  currency: string;
  provider: ContractProvider;
  state: ContractState;
  sellerAcceptedAt?: string | null;
  fundsLockedAt?: string | null;
  workSubmittedAt?: string | null;
  completedAt?: string | null;
  razorpayOrderId?: string | null;
};

export type CreateContractInput = {
  title: string;
  description?: string;
  amountMinor: string;
  currency: string;
  buyerEmail?: string;
  sellerEmail?: string;
  provider: ContractProvider;
  referenceId?: string;
};

export type ScrowCheckout =
  | {
      provider: 'stripe';
      checkoutSessionId: string;
      redirectUrl: string;
    }
  | {
      provider: 'razorpay';
      orderId: string;
      keyId: string;
      currency: string;
      amountMinor: string;
    };

export class ScrowSDK {
  private readonly apiBaseUrl: string;
  private readonly apiKey: string;

  constructor(params: { apiBaseUrl: string; apiKey: string }) {
    this.apiBaseUrl = params.apiBaseUrl.replace(/\/+$/, '');
    this.apiKey = params.apiKey;
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'x-scrow-api-key': this.apiKey,
    };
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.apiBaseUrl + path, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body ?? {}),
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    if (!res.ok) throw new Error((data as any)?.message || text || 'Request failed');
    return data;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(this.apiBaseUrl + path, {
      method: 'GET',
      headers: {
        ...this.headers(),
      },
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    if (!res.ok) throw new Error((data as any)?.message || text || 'Request failed');
    return data;
  }

  async createContract(input: CreateContractInput): Promise<ScrowDeal & { provider: ContractProvider }> {
    return this.post<ScrowDeal & { provider: ContractProvider }>(
      '/contracts',
      input,
    );
  }

  async acceptContract(contractId: string): Promise<void> {
    await this.post('/contracts/' + contractId + '/accept', { role: 'seller' });
  }

  async pay(contractId: string, params?: { returnUrl?: string }): Promise<ScrowCheckout> {
    return this.post<ScrowCheckout>('/contracts/' + contractId + '/pay', {
      returnUrl: params?.returnUrl,
    });
  }

  async submitWork(contractId: string, message?: string): Promise<void> {
    await this.post('/contracts/' + contractId + '/submit', { message: message ?? null });
  }

  async approve(contractId: string): Promise<void> {
    await this.post('/contracts/' + contractId + '/approve', {});
  }

  async getContract(contractId: string): Promise<ContractDetails> {
    return this.get('/contracts/' + contractId);
  }

  async openCheckout(checkout: ScrowCheckout): Promise<void> {
    if (checkout.provider === 'stripe') {
      window.location.href = checkout.redirectUrl;
      return;
    }

    if (checkout.provider === 'razorpay') {
      await this.ensureRazorpayScript();
      const w = window as any;
      const rzp = new w.Razorpay({
        key: checkout.keyId,
        order_id: checkout.orderId,
        amount: checkout.amountMinor,
        currency: checkout.currency,
        name: 'Scrow',
        handler: () => {
          // Webhook updates state server-side.
        },
        theme: { color: '#635bff' },
      });
      rzp.open();
      return;
    }

    throw new Error('Unknown provider');
  }

  private razorpayScriptPromise?: Promise<void>;
  private async ensureRazorpayScript(): Promise<void> {
    const w = window as any;
    if (w.Razorpay) return;

    if (!this.razorpayScriptPromise) {
      this.razorpayScriptPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    await this.razorpayScriptPromise;
  }
}

