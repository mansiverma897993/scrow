# Scrow (Trust-Based Transactions)

## What this MVP does
- Create a deal/contract
- Seller accepts
- Buyer locks payment via Stripe (manual capture) or Razorpay (authorized-only)
- Webhooks move the contract state to `FUNDS_LOCKED`
- Buyer submits work
- Release funds (approve) -> capture on the payment provider

This is a *payment holding* model (not legal escrow).

## Repo structure
- `server/` NestJS backend (API + Trust Engine + webhooks + hosted deal page)
- `sdk/` JavaScript/TypeScript SDK for integrators

## Quickstart
1. Configure env vars:
   - Copy `server/.env.example` to `server/.env`
   - If you keep `SCROW_API_KEYS` empty, the hosted deal page can call the API without sending an API key (MVP-friendly).
2. Start Postgres (optional, but recommended):
   - You can run with `docker compose up -d` if you use the provided compose file (not mandatory).
3. Install & run:
   - `cd server`
   - `npm i`
   - `npm run dev`
4. Build & use the SDK:
   - `cd sdk`
   - `npm i`
   - `npm run build`

## Key endpoints
- `POST /contracts`
- `POST /contracts/:id/accept`
- `POST /contracts/:id/pay`
- `POST /contracts/:id/submit`
- `POST /contracts/:id/approve`
- `GET /deal/:token` (hosted flow)
- Webhooks:
  - `POST /webhooks/stripe`
  - `POST /webhooks/razorpay`

