# Scrow - Trust-Based Transactions Plugin

Scrow is a "Stripe for trust-based transactions" engine:
- Create deal contracts
- Lock buyer payment
- Submit work
- Release funds on approval

This is a **payment holding model** for MVP (not legal escrow).

## What is included
- `server/`: NestJS API + PostgreSQL + state machine + Stripe/Razorpay + webhooks + animated hosted UI
- `sdk/`: JS/TS SDK package
- Browser plugin script endpoint: `GET /sdk/scrow.js`

## Workflow (state machine)
`ACTIVE -> FUNDS_LOCKED -> WORK_SUBMITTED -> COMPLETED`

Invalid transitions are blocked by backend logic.

## Prerequisites
- Node.js 18+ (recommended 20+)
- npm
- PostgreSQL (local install) **or** Docker
- Stripe and/or Razorpay account if testing real payments

## 1) Environment setup
Copy env file:

### Windows (PowerShell)
```powershell
cd server
copy .env.example .env
```

### macOS/Linux
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
- `DATABASE_URL=postgres://scrow:scrow@localhost:5432/scrow`
- `APP_BASE_URL=http://localhost:4000`
- `SCROW_API_KEYS=` (empty for local hosted UI, or add comma-separated keys)
- Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) if using Stripe
- Razorpay keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) if using Razorpay

## 2) Start PostgreSQL

### Option A: Docker (all systems)
From repo root:
```bash
docker compose up -d
```

### Option B: local PostgreSQL
Create database/user manually and set `DATABASE_URL` accordingly.

## 2.1) Quick verified local run (2026-03-31)
From repo root in this workspace:
```bash
npm --prefix d:\\scrow run setup
npm --prefix d:\\scrow run dev
```
Then verify service availability:
```bash
timeout 5 && curl -I http://localhost:4000
```
Expected output: HTTP 200 (or 302 for hosted UI redirect)

- Server listens on `http://localhost:4000`
- Database URL (from `.env`): `postgres://scrow:scrow@localhost:5432/scrow`


## 3) Install dependencies

### Windows / macOS / Linux
```bash
cd server
npm install
cd ../sdk
npm install
cd ..
```

## 4) Run project

### From repo root (all systems)
```bash
npm run dev
```

This starts backend on `http://localhost:4000`.

### Windows quick-open command
```powershell
npm run dev:open
```

## 5) Open the frontend
- Home/Create page: [http://localhost:4000](http://localhost:4000)
- Deal page: generated link like `http://localhost:4000/deal/<token>`

## 6) Enable real payment state updates (webhooks)
Without webhooks, contract will not move to `FUNDS_LOCKED`.

Expose local app:
```bash
ngrok http 4000
```

Set webhook URLs:
- Stripe -> `https://<ngrok-url>/webhooks/stripe`
- Razorpay -> `https://<ngrok-url>/webhooks/razorpay`

## API endpoints
- `POST /contracts`
- `POST /contracts/:id/accept`
- `POST /contracts/:id/pay`
- `POST /contracts/:id/submit`
- `POST /contracts/:id/approve`
- `GET /contracts/:id`
- `GET /contracts/by-token/:token`
- `GET /deal/:token`
- `GET /sdk/scrow.js`
- `POST /webhooks/stripe`
- `POST /webhooks/razorpay`

## Plugin usage (browser script)
```html
<script src="http://localhost:4000/sdk/scrow.js"></script>
<script>
  const scrow = new window.ScrowSDK({
    apiBaseUrl: "http://localhost:4000",
    apiKey: ""
  });

  async function startDeal() {
    const deal = await scrow.createContract({
      title: "Logo Design",
      description: "One concept + source files",
      amountMinor: "5000",
      currency: "INR",
      provider: "razorpay"
    });
    console.log(deal.dealUrl);
  }
</script>
```

## SDK build
```bash
cd sdk
npm run build
```

## Production notes
- `synchronize: true` in TypeORM is for MVP/dev only; use migrations in production.
- Add auth/RBAC, audit logs, rate limits, and compliance checks before launch.
- Do not market as legal escrow until regulatory review is complete.

