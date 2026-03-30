import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ContractsService } from '../contracts/contracts.service';

@Controller()
export class HostedController {
  constructor(private readonly contracts: ContractsService) {}

  @Get('/deal/:token')
  async dealPage(@Param('token') token: string) {
    const contract = await this.contracts.getByToken(token);

    const state = contract.state;
    const provider = contract.provider;
    const amountMinor = contract.amountMinor;
    const currency = contract.currency;
    const title = contract.title;
    const contractId = contract.id;

    if (!contractId) throw new NotFoundException('Deal not found');

    const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');
    const page = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Scrow Deal</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; max-width: 760px; }
      code { background: #f5f5f5; padding: 2px 6px; border-radius: 6px; }
      button { padding: 10px 14px; margin: 6px 0; cursor: pointer; }
      .muted { color: #666; }
      .status { padding: 12px; border: 1px solid #eee; border-radius: 10px; margin-top: 14px; }
    </style>
  </head>
  <body>
    <h1>Scrow Deal</h1>
    <p class="muted">Payment holding (not legal escrow). Provider: <code>${provider}</code></p>
    <h2>${escapeHtml(title)}</h2>
    <p>Amount: <code>${amountMinor} ${currency.toUpperCase()}</code></p>

    <div>
      <button id="acceptBtn">1) Seller Accept</button>
      <button id="payBtn">2) Pay with Escrow</button>
      <button id="submitBtn">3) Submit Work</button>
      <button id="approveBtn">4) Approve & Release</button>
    </div>

    <div class="status" id="statusBox">
      <div>Contract ID: <code>${contractId}</code></div>
      <div>State: <strong id="stateLabel">${escapeHtml(state)}</strong></div>
      <div class="muted" style="margin-top: 6px;">Polling contract status...</div>
    </div>

    <script>
      const CONTRACT_ID = ${json(contractId)};
      const PROVIDER = ${json(provider)};

      async function api(path, options = {}) {
        const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); } catch (e) {}
        if (!res.ok) throw new Error(data?.message || text || 'Request failed');
        return data;
      }

      async function refresh() {
        const c = await api('/contracts/' + CONTRACT_ID);
        document.getElementById('stateLabel').textContent = c.state;
        wireButtons(c);
      }

      async function acceptSeller() {
        await api('/contracts/' + CONTRACT_ID + '/accept', { method: 'POST', body: JSON.stringify({ role: 'seller' }) });
        await refresh();
      }

      async function pay() {
        const url = window.location.href.split('#')[0];
        const data = await api('/contracts/' + CONTRACT_ID + '/pay', { method: 'POST', body: JSON.stringify({ returnUrl: url }) });
        if (data.provider === 'stripe') {
          window.location.href = data.redirectUrl;
          return;
        }
        if (data.provider === 'razorpay') {
          await ensureRazorpayScript();
          const opts = {
            key: data.keyId,
            order_id: data.orderId,
            amount: Number(data.amountMinor),
            currency: data.currency,
            name: 'Scrow',
            description: 'Scrow deal payment',
            handler: async function (response) {
              // Webhook will update state; we just refresh.
              setTimeout(refresh, 2000);
            },
            prefill: { email: '', contact: '' },
            notes: {},
            theme: { color: '#635bff' }
          };
          const rzp = new window.Razorpay(opts);
          rzp.open();
          return;
        }
        throw new Error('Unknown checkout provider response');
      }

      async function submitWork() {
        const message = prompt('Add work submission message (optional):') || '';
        await api('/contracts/' + CONTRACT_ID + '/submit', { method: 'POST', body: JSON.stringify({ message }) });
        await refresh();
      }

      async function approve() {
        await api('/contracts/' + CONTRACT_ID + '/approve', { method: 'POST', body: JSON.stringify({}) });
        await refresh();
      }

      async function ensureRazorpayScript() {
        if (window.Razorpay) return;
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      function wireButtons(contract) {
        const state = contract.state;
        document.getElementById('acceptBtn').disabled = state !== 'ACTIVE';
        document.getElementById('payBtn').disabled = state !== 'ACTIVE' || !contract.sellerAcceptedAt;
        document.getElementById('submitBtn').disabled = state !== 'FUNDS_LOCKED';
        document.getElementById('approveBtn').disabled = state !== 'WORK_SUBMITTED';
      }

      document.getElementById('acceptBtn').addEventListener('click', acceptSeller);
      document.getElementById('payBtn').addEventListener('click', pay);
      document.getElementById('submitBtn').addEventListener('click', submitWork);
      document.getElementById('approveBtn').addEventListener('click', approve);

      // Initial UI state + polling.
      wireButtons(${json({
        state,
        sellerAcceptedAt: contract.sellerAcceptedAt,
      })});
      refresh().catch(err => {
        console.error(err);
        document.querySelector('.muted').textContent = 'Error loading contract: ' + (err?.message || err);
      });
      setInterval(refresh, 5000);
    </script>
  </body>
</html>`;

    return page;
  }
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

