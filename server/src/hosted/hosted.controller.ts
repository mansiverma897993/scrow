import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ContractsService } from '../contracts/contracts.service';

@Controller()
export class HostedController {
  constructor(private readonly contracts: ContractsService) {}

  @Get('/')
  homePage() {
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Scrow Demo</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; max-width: 840px; }
      input, select, textarea { width: 100%; padding: 8px; margin: 6px 0 12px; box-sizing: border-box; }
      button { padding: 10px 14px; cursor: pointer; }
      .card { border: 1px solid #eee; border-radius: 10px; padding: 16px; margin-top: 14px; }
      .muted { color: #666; }
      code { background: #f6f6f6; padding: 2px 6px; border-radius: 6px; }
      .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    </style>
  </head>
  <body>
    <h1>Scrow Local Demo</h1>
    <p class="muted">Create deal -> open deal link -> accept, pay, submit, approve.</p>

    <div class="card">
      <h3>Create Contract</h3>
      <label>API Key (optional if server SCROW_API_KEYS is empty)</label>
      <input id="apiKey" placeholder="dev-key" />

      <label>Title</label>
      <input id="title" value="Logo Design" />

      <label>Description</label>
      <textarea id="description">One logo concept + source files</textarea>

      <div class="row">
        <div>
          <label>Amount (minor units)</label>
          <input id="amountMinor" value="5000" />
        </div>
        <div>
          <label>Currency</label>
          <input id="currency" value="INR" />
        </div>
      </div>

      <label>Provider</label>
      <select id="provider">
        <option value="razorpay">Razorpay</option>
        <option value="stripe">Stripe</option>
      </select>

      <div class="row">
        <div>
          <label>Buyer Email (optional)</label>
          <input id="buyerEmail" placeholder="buyer@example.com" />
        </div>
        <div>
          <label>Seller Email (optional)</label>
          <input id="sellerEmail" placeholder="seller@example.com" />
        </div>
      </div>

      <button id="createBtn">Create Deal</button>
    </div>

    <div class="card" id="resultCard" style="display:none;">
      <h3>Deal Created</h3>
      <div>Contract ID: <code id="contractId"></code></div>
      <div style="margin-top:8px;">Deal link: <a id="dealUrl" href="#" target="_blank"></a></div>
      <div style="margin-top:12px;"><button id="openDealBtn">Open Deal Page</button></div>
    </div>

    <script>
      const apiKeyInput = document.getElementById('apiKey');
      apiKeyInput.value = localStorage.getItem('scrow_api_key') || '';

      function getHeaders() {
        const key = (apiKeyInput.value || '').trim();
        if (key) localStorage.setItem('scrow_api_key', key);
        const headers = { 'Content-Type': 'application/json' };
        if (key) headers['x-scrow-api-key'] = key;
        return headers;
      }

      async function createDeal() {
        const payload = {
          title: document.getElementById('title').value,
          description: document.getElementById('description').value,
          amountMinor: String(document.getElementById('amountMinor').value).trim(),
          currency: String(document.getElementById('currency').value).trim(),
          provider: document.getElementById('provider').value,
          buyerEmail: String(document.getElementById('buyerEmail').value).trim() || undefined,
          sellerEmail: String(document.getElementById('sellerEmail').value).trim() || undefined
        };

        const res = await fetch('/contracts', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); } catch (e) {}
        if (!res.ok) throw new Error(data?.message || text || 'Create failed');

        document.getElementById('resultCard').style.display = 'block';
        document.getElementById('contractId').textContent = data.id;
        document.getElementById('dealUrl').textContent = data.dealUrl;
        document.getElementById('dealUrl').href = data.dealUrl;
        document.getElementById('openDealBtn').onclick = () => window.open(data.dealUrl, '_blank');
      }

      document.getElementById('createBtn').addEventListener('click', () => {
        createDeal().catch(err => alert(err?.message || String(err)));
      });
    </script>
  </body>
</html>`;
  }

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
        const key = localStorage.getItem('scrow_api_key') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (key) headers['x-scrow-api-key'] = key;
        const res = await fetch(path, { headers, ...options });
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

