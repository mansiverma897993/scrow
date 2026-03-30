import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common';
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
    <title>Scrow Plugin Demo</title>
    <style>
      :root {
        --bg: #0b1020;
        --panel: rgba(255,255,255,0.08);
        --line: rgba(255,255,255,0.14);
        --text: #eaf1ff;
        --muted: #9db0d4;
        --brand: #6f7cff;
        --brand2: #20d2ff;
        --ok: #22c55e;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        color: var(--text);
        font-family: Inter, Segoe UI, Arial, sans-serif;
        background: radial-gradient(1200px 600px at 10% -10%, #283d8f 0%, transparent 45%),
                    radial-gradient(900px 500px at 90% 0%, #094f71 0%, transparent 45%),
                    var(--bg);
      }
      .wrap { width: min(1040px, 94vw); margin: 34px auto; }
      .hero {
        display: flex; justify-content: space-between; gap: 18px; align-items: center; margin-bottom: 20px;
      }
      .hero h1 { margin: 0; font-size: clamp(26px, 4vw, 40px); letter-spacing: 0.2px; }
      .hero p { margin: 8px 0 0; color: var(--muted); }
      .badge {
        border: 1px solid var(--line); color: #dbeafe; padding: 8px 12px; border-radius: 999px;
        background: rgba(255,255,255,0.04); font-size: 13px;
      }
      .grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; }
      @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }
      .card {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--panel);
        backdrop-filter: blur(8px);
        padding: 20px;
        animation: fadeIn 0.45s ease;
      }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
      label { color: #d5def4; font-size: 13px; display: block; margin-bottom: 6px; }
      input, select, textarea {
        width: 100%; border: 1px solid var(--line); color: var(--text); background: rgba(0,0,0,0.25);
        border-radius: 12px; padding: 11px 12px; margin-bottom: 12px; outline: none;
      }
      input:focus, select:focus, textarea:focus { border-color: #7aa2ff; box-shadow: 0 0 0 3px rgba(122,162,255,0.25); }
      .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .btn {
        border: none; border-radius: 12px; padding: 12px 14px; cursor: pointer;
        background: linear-gradient(120deg, var(--brand), var(--brand2)); color: white; font-weight: 700;
        transition: transform .14s ease, box-shadow .14s ease, opacity .14s ease;
      }
      .btn:hover { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(32,210,255,0.25); }
      .btn:disabled { opacity: .65; cursor: not-allowed; transform: none; }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        background: rgba(0,0,0,0.28);
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 2px 6px;
        word-break: break-all;
      }
      .muted { color: var(--muted); }
      .ok { color: var(--ok); }
      .steps { display: grid; gap: 10px; margin: 14px 0 0; }
      .step {
        border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; background: rgba(255,255,255,0.03);
      }
      .toast {
        position: fixed; right: 16px; bottom: 16px; border: 1px solid var(--line); border-radius: 12px;
        background: rgba(9,14,30,0.92); color: #fff; padding: 10px 14px; opacity: 0; transform: translateY(12px);
        transition: all .2s ease; pointer-events: none;
      }
      .toast.show { opacity: 1; transform: translateY(0); }
      a { color: #b8d5ff; }
      pre {
        margin: 0; white-space: pre-wrap; font-size: 12px; color: #d6e4ff;
        background: rgba(0,0,0,0.26); border: 1px solid var(--line); border-radius: 10px; padding: 12px;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="hero">
        <div>
          <h1>Scrow Plugin Studio</h1>
          <p>Build trust-based deals with payment lock, delivery, and release flow.</p>
        </div>
        <div class="badge">Powered by Stripe / Razorpay</div>
      </div>

      <div class="grid">
        <section class="card">
          <h2 style="margin:0 0 14px;">Create New Deal</h2>
          <label>API Key (optional if SCROW_API_KEYS is empty)</label>
          <input id="apiKey" placeholder="dev-key" />

          <label>Title</label>
          <input id="title" value="Logo Design" />

          <label>Description</label>
          <textarea id="description" rows="3">One logo concept + source files</textarea>

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

          <button class="btn" id="createBtn">Create Secure Deal</button>
          <p id="createStatus" class="muted" style="margin:10px 0 0;"></p>
        </section>

        <aside class="card">
          <h3 style="margin-top:0;">Integration Snippet</h3>
          <pre>&lt;script src="http://localhost:4000/sdk/scrow.js"&gt;&lt;/script&gt;
&lt;script&gt;
  const scrow = new window.ScrowSDK({
    apiBaseUrl: 'http://localhost:4000',
    apiKey: ''
  });
&lt;/script&gt;</pre>
          <div class="steps">
            <div class="step"><strong>1)</strong> Create deal on this page</div>
            <div class="step"><strong>2)</strong> Open deal link and accept</div>
            <div class="step"><strong>3)</strong> Lock payment, submit, approve</div>
          </div>
        </aside>
      </div>

      <section class="card" id="resultCard" style="display:none; margin-top: 16px;">
        <h2 style="margin-top:0;" class="ok">Deal Created Successfully</h2>
        <p>Contract ID: <span class="mono" id="contractId"></span></p>
        <p>Deal Link: <a id="dealUrl" href="#" target="_blank"></a></p>
        <button class="btn" id="openDealBtn">Open Deal Workflow</button>
      </section>
    </div>

    <div id="toast" class="toast"></div>
    <script>
      const toastEl = document.getElementById('toast');
      function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 1800);
      }

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
          title: document.getElementById('title').value.trim(),
          description: document.getElementById('description').value.trim(),
          amountMinor: String(document.getElementById('amountMinor').value).trim(),
          currency: String(document.getElementById('currency').value).trim(),
          provider: document.getElementById('provider').value,
          buyerEmail: String(document.getElementById('buyerEmail').value).trim() || undefined,
          sellerEmail: String(document.getElementById('sellerEmail').value).trim() || undefined
        };
        if (!payload.title) throw new Error('Title is required');
        if (!/^[0-9]+$/.test(payload.amountMinor)) throw new Error('Amount must be integer minor units');
        if (!payload.currency) throw new Error('Currency is required');

        const res = await fetch('/contracts', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); } catch (e) {}
        if (!res.ok) throw new Error(data?.message || text || 'Create failed');
        return data;
      }

      document.getElementById('createBtn').addEventListener('click', async () => {
        const btn = document.getElementById('createBtn');
        const status = document.getElementById('createStatus');
        btn.disabled = true;
        status.textContent = 'Creating secure deal...';
        try {
          const data = await createDeal();
          document.getElementById('resultCard').style.display = 'block';
          document.getElementById('contractId').textContent = data.id;
          document.getElementById('dealUrl').textContent = data.dealUrl;
          document.getElementById('dealUrl').href = data.dealUrl;
          document.getElementById('openDealBtn').onclick = () => window.open(data.dealUrl, '_blank');
          status.textContent = 'Done. Share the deal URL with buyer/seller.';
          toast('Deal created');
        } catch (err) {
          status.textContent = err?.message || String(err);
          toast('Create failed');
        } finally {
          btn.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
  }

  @Get('/sdk/scrow.js')
  @Header('Content-Type', 'application/javascript; charset=utf-8')
  sdkScript() {
    return `;(function(global){
  class ScrowSDK {
    constructor(options){
      this.apiBaseUrl = (options && options.apiBaseUrl ? options.apiBaseUrl : '').replace(/\\/+$/, '');
      this.apiKey = options && options.apiKey ? options.apiKey : '';
    }
    _headers(){
      var h = {'Content-Type':'application/json'};
      if (this.apiKey) h['x-scrow-api-key'] = this.apiKey;
      return h;
    }
    _url(path){ return this.apiBaseUrl + path; }
    async _request(path, method, body){
      const res = await fetch(this._url(path), {
        method: method || 'GET',
        headers: this._headers(),
        body: body ? JSON.stringify(body) : undefined
      });
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch(e) {}
      if (!res.ok) throw new Error((data && data.message) || text || 'Request failed');
      return data;
    }
    createContract(input){ return this._request('/contracts', 'POST', input); }
    acceptContract(contractId){ return this._request('/contracts/' + contractId + '/accept', 'POST', { role:'seller' }); }
    pay(contractId, returnUrl){ return this._request('/contracts/' + contractId + '/pay', 'POST', { returnUrl: returnUrl || window.location.href }); }
    submitWork(contractId, message){ return this._request('/contracts/' + contractId + '/submit', 'POST', { message: message || '' }); }
    approve(contractId){ return this._request('/contracts/' + contractId + '/approve', 'POST', {}); }
    getContract(contractId){ return this._request('/contracts/' + contractId, 'GET'); }
    async openCheckout(checkout){
      if (checkout.provider === 'stripe') { window.location.href = checkout.redirectUrl; return; }
      if (checkout.provider === 'razorpay') {
        await this._ensureRazorpay();
        var rzp = new global.Razorpay({
          key: checkout.keyId,
          order_id: checkout.orderId,
          amount: Number(checkout.amountMinor),
          currency: checkout.currency,
          name: 'Scrow',
          description: 'Scrow secure checkout',
          handler: function(){}
        });
        rzp.open();
        return;
      }
      throw new Error('Unknown checkout provider');
    }
    _ensureRazorpay(){
      if (global.Razorpay) return Promise.resolve();
      return new Promise(function(resolve, reject){
        var s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = function(){ resolve(); };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
  }
  global.ScrowSDK = ScrowSDK;
})(window);`;
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
    <title>Scrow Deal Workflow</title>
    <style>
      :root {
        --bg: #0b1020;
        --panel: rgba(255,255,255,0.08);
        --line: rgba(255,255,255,0.14);
        --text: #eaf1ff;
        --muted: #9db0d4;
        --brand: #6f7cff;
        --brand2: #20d2ff;
        --active: #22c55e;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        color: var(--text);
        font-family: Inter, Segoe UI, Arial, sans-serif;
        background: radial-gradient(1200px 600px at 10% -10%, #283d8f 0%, transparent 45%),
                    radial-gradient(900px 500px at 90% 0%, #094f71 0%, transparent 45%),
                    var(--bg);
      }
      .wrap { width: min(920px, 94vw); margin: 30px auto; }
      .card {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--panel);
        backdrop-filter: blur(8px);
        padding: 20px;
        animation: lift .45s ease;
      }
      @keyframes lift { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform: translateY(0);} }
      .pill { display:inline-block; border:1px solid var(--line); border-radius:999px; padding: 6px 10px; color:#c9dcff; font-size:13px; }
      .steps { display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin: 16px 0; }
      @media (max-width:800px){ .steps { grid-template-columns: 1fr 1fr; } }
      .step { border:1px solid var(--line); border-radius:12px; padding:10px; text-align:center; color: var(--muted); }
      .step.active { border-color: rgba(34,197,94,0.6); color: #dcfce7; background: rgba(34,197,94,0.14); }
      .buttons { display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-top: 10px; }
      .btn {
        border:none; border-radius:12px; padding:12px; cursor:pointer; font-weight:700; color:white;
        background: linear-gradient(120deg, var(--brand), var(--brand2));
        transition: transform .14s ease, box-shadow .14s ease, opacity .14s ease;
      }
      .btn:hover { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(32,210,255,0.22);}
      .btn:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: rgba(0,0,0,0.28); border: 1px solid var(--line); border-radius: 10px; padding:2px 7px; }
      .muted { color: var(--muted); }
      .toast {
        position: fixed; right: 16px; bottom: 16px; border: 1px solid var(--line); border-radius: 12px;
        background: rgba(9,14,30,0.92); color: #fff; padding: 10px 14px; opacity: 0; transform: translateY(12px);
        transition: all .2s ease; pointer-events: none;
      }
      .toast.show { opacity: 1; transform: translateY(0); }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1 style="margin:0 0 6px;">Scrow Deal Workflow</h1>
        <p class="muted" style="margin:0;">Payment holding model. Provider: <span class="pill">${provider}</span></p>
        <h2 style="margin:12px 0 8px;">${escapeHtml(title)}</h2>
        <p>Amount: <span class="mono">${amountMinor} ${currency.toUpperCase()}</span></p>

        <div class="steps">
          <div id="step1" class="step">1. Seller Accept</div>
          <div id="step2" class="step">2. Lock Payment</div>
          <div id="step3" class="step">3. Submit Work</div>
          <div id="step4" class="step">4. Approve Release</div>
        </div>

        <div class="buttons">
          <button class="btn" id="acceptBtn">Seller Accept</button>
          <button class="btn" id="payBtn">Pay with Escrow</button>
          <button class="btn" id="submitBtn">Submit Work</button>
          <button class="btn" id="approveBtn">Approve & Release</button>
        </div>

        <div style="margin-top: 14px;">
          <div>Contract ID: <span class="mono">${contractId}</span></div>
          <div style="margin-top: 6px;">State: <strong id="stateLabel">${escapeHtml(state)}</strong></div>
          <div id="statusText" class="muted" style="margin-top: 6px;">Polling contract status...</div>
        </div>
      </div>
    </div>
    <div id="toast" class="toast"></div>
    <script>
      const CONTRACT_ID = ${json(contractId)};
      const toastEl = document.getElementById('toast');
      function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 1800);
      }

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
        document.getElementById('statusText').textContent = 'Latest update: ' + new Date().toLocaleTimeString();
        wireButtons(c);
        wireSteps(c);
      }

      async function acceptSeller() {
        await api('/contracts/' + CONTRACT_ID + '/accept', { method: 'POST', body: JSON.stringify({ role: 'seller' }) });
        toast('Seller accepted');
        await refresh();
      }

      async function pay() {
        const url = window.location.href.split('#')[0];
        const data = await api('/contracts/' + CONTRACT_ID + '/pay', { method: 'POST', body: JSON.stringify({ returnUrl: url }) });
        if (data.provider === 'stripe') {
          toast('Redirecting to Stripe');
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
              toast('Payment submitted, awaiting webhook');
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
        toast('Work submitted');
        await refresh();
      }

      async function approve() {
        await api('/contracts/' + CONTRACT_ID + '/approve', { method: 'POST', body: JSON.stringify({}) });
        toast('Funds released');
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
      function wireSteps(contract) {
        const map = {
          ACTIVE: 1,
          FUNDS_LOCKED: 2,
          WORK_SUBMITTED: 3,
          COMPLETED: 4
        };
        const n = map[contract.state] || 1;
        for (let i = 1; i <= 4; i++) {
          const el = document.getElementById('step' + i);
          el.classList.toggle('active', i <= n);
        }
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
      wireSteps(${json({
        state,
      })});
      refresh().catch(err => {
        console.error(err);
        document.getElementById('statusText').textContent = 'Error loading contract: ' + (err?.message || err);
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

