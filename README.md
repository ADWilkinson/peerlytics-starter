# Peerlytics & USDCtoFiat Starters

Production-ready examples and a live demo for the two SDKs that cover the ZKP2P protocol on Base: server-side analytics with **@peerlytics/sdk** and wallet-native USDC off-ramps with **@usdctofiat/offramp**.

[![npm: @peerlytics/sdk](https://img.shields.io/npm/v/@peerlytics/sdk?label=%40peerlytics%2Fsdk&color=1b5e4e)](https://www.npmjs.com/package/@peerlytics/sdk)
[![npm: @usdctofiat/offramp](https://img.shields.io/npm/v/@usdctofiat/offramp?label=%40usdctofiat%2Fofframp&color=6e4a0e)](https://www.npmjs.com/package/@usdctofiat/offramp)

**Live demo:** [offramp-sdk.vercel.app](https://offramp-sdk.vercel.app)
**Developer portals:** [usdctofiat.xyz/developers](https://usdctofiat.xyz/developers) · [peerlytics.xyz/developers](https://peerlytics.xyz/developers)

## 60-second deposit

```ts
import { offramp, PLATFORMS, CURRENCIES } from "@usdctofiat/offramp";

const { depositId, txHash } = await offramp(walletClient, {
  amount: "100",
  platform: PLATFORMS.REVOLUT,
  currency: CURRENCIES.EUR,
  identifier: "alice",
});
```

That single call approves USDC, creates the escrow deposit on Base, and delegates pricing to the managed vault. Your users settle on Revolut, Venmo, Wise, CashApp, Zelle, Monzo, or PayPal without leaving your app.

Need a fresh app skeleton instead of dropping into an existing one?

```bash
npx create-offramp-app@latest my-offramp --template=next         # next | vite | telegram-bot
```

**Agent skills (Claude Code, Cursor):** [`integrate-usdctofiat-offramp`](skills/claude/integrate-usdctofiat-offramp/SKILL.md) · [`query-peerlytics-data`](skills/claude/query-peerlytics-data/SKILL.md). Or hand the canonical `llms-full.txt` files to any assistant: [usdctofiat.xyz/llms-full.txt](https://usdctofiat.xyz/llms-full.txt) · [peerlytics.xyz/llms-full.txt](https://peerlytics.xyz/llms-full.txt).

## What's in this repo

```text
demo/                        Vite + React demo app (deployed to Vercel)
  src/App.tsx                  single-page UI: create deposits, live orderbook, withdraw
  api/orderbook.ts             Vercel serverless orderbook proxy
  server/peerlytics.ts         shared Peerlytics server helper (dev + prod)

peerlytics/                  @peerlytics/sdk examples (run standalone with tsx/bun)
  orderbook-snapshot.ts        multi-currency orderbook depth
  rate-monitor.ts              poll rates, alert on threshold
  volume-dashboard.ts          protocol stats terminal dashboard
  maker-report.ts              portfolio report for a maker address
  integrator-report.ts         ERC-8021 integrator stats (deposits, volume, top markets)
  timeseries-chart.ts          hourly/daily rollups in a terminal sparkbar chart
  live-activity.ts             real-time protocol event stream (SSE)
  webhook-receiver.ts          HMAC-verified HTTPS receiver for outbound webhooks
  x402-agent.ts                x402 pay-per-request flow (no API key needed)
  llms.txt                     LLM-friendly SDK reference

usdctofiat/                  @usdctofiat/offramp examples
  create-deposit.ts            create and delegate a USDC deposit
  close-deposit.ts             withdraw remaining USDC and close a deposit
  resume-deposit.ts            resume an interrupted deposit flow
  otc-deposit.ts               create an OTC deposit restricted to a single taker
  manage-deposits.ts           list and inspect deposits for a wallet
  platform-explorer.ts         enumerate platforms, currencies, and validation
  react-example.tsx            useOfframp hook usage in React
  webhook-receiver.ts          HMAC-verified HTTPS receiver for deposit/otc events
  llms.txt                     LLM-friendly SDK reference

skills/                      Claude Code skills for AI-assisted development
  claude/
    query-peerlytics-data/         skill: query protocol data via Peerlytics SDK
    integrate-usdctofiat-offramp/  skill: integrate the offramp SDK
```

## Run the examples

Each script under `peerlytics/` and `usdctofiat/` runs standalone:

```bash
# Peerlytics (server-side, free key includes 1,000 requests/month)
export PEERLYTICS_API_KEY=pk_live_...
npx tsx peerlytics/orderbook-snapshot.ts
npx tsx peerlytics/live-activity.ts

# USDCtoFiat (wallet-side, needs a private key for tx examples)
npx tsx usdctofiat/platform-explorer.ts
```

Get a free API key at [peerlytics.xyz/developers](https://peerlytics.xyz/developers?tab=account) — same key authenticates the Peerlytics paid API _and_ outbound webhooks for both products.

## Run the demo locally

```bash
cd demo
npm install
cp .env.example .env.local         # set PEERLYTICS_API_KEY
npm run dev
```

Deploy to Vercel:

```bash
cd demo
vercel link                                # link to your Vercel project
vercel env add PEERLYTICS_API_KEY production
vercel env add PEERLYTICS_API_KEY preview
vercel --prod
```

The orderbook API key stays server-side and is never exposed to the browser.

## SDKs at a glance

### @peerlytics/sdk

Real-time analytics for the ZKP2P protocol. Orderbooks, activity feeds, maker stats, vault data.

```ts
import { Peerlytics } from "@peerlytics/sdk";

const client = new Peerlytics({ apiKey: "pk_live_..." });
const { orderbooks } = await client.getOrderbook({ currency: "USD", platform: "revolut" });
```

Auth options: [free API key](https://peerlytics.xyz/developers?tab=account) (1,000 requests/month) or x402 pay-per-request with USDC on Base.

**Gotchas worth knowing upfront** (SDK ≥ 0.4.0):

- List methods (`getActivity`, `getDeposits`, `getIntents`, `getMarketSummary`) return paginated envelopes like `{ events, count, hasMore, ... }` — iterate over `.events` / `.deposits` / etc, not the top-level result.
- `getDeposits()` requires at least one of `depositor`, `delegate`, `platform`, `currency`; `getIntents()` requires at least one of `owner`, `recipient`, `verifier`, `depositId`, `status`. Both throw `ValidationError` client-side if called empty.
- `DepositMarket.currency` / `deposit.currencies[].currency` are resolved ISO codes (e.g. `"GBP"`). `currencyCode` is the raw bytes32 hash — use `currency` for display.

[npm](https://www.npmjs.com/package/@peerlytics/sdk) · [Developer portal](https://peerlytics.xyz/developers) · [OpenAPI spec](https://peerlytics.xyz/api/openapi) · [llms.txt](https://peerlytics.xyz/llms.txt)

### @usdctofiat/offramp

Delegated USDC-to-fiat off-ramp on Base. Revolut, Venmo, Wise, PayPal, and more.

```ts
import { useOfframp } from "@usdctofiat/offramp/react";
import { PLATFORMS, CURRENCIES } from "@usdctofiat/offramp";

const { offramp, deposits, close } = useOfframp();
await offramp(walletClient, {
  amount: "100",
  platform: PLATFORMS.REVOLUT,
  currency: CURRENCIES.USD,
  identifier: "alice",
});
```

Need a private order? Pass `otcTaker` to restrict the deposit to a single wallet — or use `enableOtc` / `disableOtc` / `getOtcLink` to retrofit restriction on an existing deposit. See `usdctofiat/otc-deposit.ts` for both paths.

**PayPal and Wise** makers must register their handle in the Peer (PeerAuth) browser extension before the first deposit. v2 adds a new `EXTENSION_REGISTRATION_REQUIRED` error code plus `usePeerExtensionRegistration(platform)` to drive the install / connect / verify flow. See `usdctofiat/paypal-react-example.tsx` and `usdctofiat/paypal-deposit.ts`. PayPal uses the `paypal.me` **username** — not the account email.

Supported platforms: Revolut, Venmo, CashApp, Chime, Wise, Mercado Pago, Zelle, PayPal, Monzo, N26.

[npm](https://www.npmjs.com/package/@usdctofiat/offramp) · [Developer portal](https://usdctofiat.xyz/developers) · [API reference](https://usdctofiat.xyz/developers/api)

## Webhooks

Both products deliver HMAC-SHA256 signed outbound webhooks. Register endpoints at [peerlytics.xyz/developers](https://peerlytics.xyz/developers?tab=account) (one key, both products) and store the secret returned on register — it is only shown once.

```bash
# USDCtoFiat: deposit + otc events
WEBHOOK_SECRET=whsec_... npx tsx usdctofiat/webhook-receiver.ts

# Peerlytics: deposit / intent / rate events
WEBHOOK_SECRET=whsec_... npx tsx peerlytics/webhook-receiver.ts
```

The verification pattern is identical across both: `t=<unix>,v1=<hex>` signature header, HMAC-SHA256 over `${timestamp}.${rawBody}`, 5-minute replay window. Copy the reference implementation straight into your server — it's ~150 LOC with no dependencies beyond `node:crypto`.

## Links

- [usdctofiat.xyz/developers](https://usdctofiat.xyz/developers) — offramp SDK landing + API reference
- [peerlytics.xyz/developers](https://peerlytics.xyz/developers) — analytics SDK + API key dashboard
- [Peerlytics Explorer](https://peerlytics.xyz/explorer) — protocol explorer and market intel
- [ZKP2P Protocol](https://zkp2p.xyz)
- [@andrewwilkinson](https://x.com/andrewwilkinson)

## License

[MIT](LICENSE)
