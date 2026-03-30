# Scrow SDK

Browser SDK for creating/accepting/pay/releasing escrow-like trust contracts.

## Usage (example)

```ts
import { ScrowSDK } from 'scrow-sdk';

const scrow = new ScrowSDK({
  apiBaseUrl: 'http://localhost:4000',
  apiKey: 'dev-key', // optional if SCROW_API_KEYS is empty
});

const deal = await scrow.createContract({
  title: 'Logo Design',
  description: 'One logo concept',
  amountMinor: '5000',
  currency: 'INR',
  provider: 'razorpay', // or 'stripe'
});

// Share deal.dealUrl with the seller/buyer.

await scrow.acceptContract(deal.id);
const checkout = await scrow.pay(deal.id);
await scrow.openCheckout(checkout);
```

