---
name: query-peerlytics-data
description: Query ZKP2P protocol data using the @peerlytics/sdk — rates, orderbooks, deposits, maker portfolios, live activity, and vault analytics. Use when asked about P2P exchange rates, USDC liquidity, maker stats, or protocol analytics on Base.
---

# Query Peerlytics Data

## Overview

Guide the user to query ZKP2P protocol data using `@peerlytics/sdk`. The SDK provides real-time access to P2P exchange rates, orderbooks, maker portfolios, protocol activity, and vault analytics on Base.

## When to use

- User asks about USDC exchange rates or P2P liquidity
- User wants protocol analytics (volume, deposits, spreads)
- User asks about maker performance or deposit data
- User wants to build a dashboard or monitor with ZKP2P data
- User mentions Peerlytics, ZKP2P, or protocol analytics

## Installation

```bash
npm install @peerlytics/sdk
```

## Authentication

Two options:

**API key** (recommended): 1,000 free requests/month.
```typescript
import { Peerlytics } from "@peerlytics/sdk";
const client = new Peerlytics({ apiKey: "pk_live_..." });
// Get a key at https://peerlytics.xyz/developers
```

**x402** (keyless): Pay per request with USDC on Base. No account needed.

## Response shapes & required filters

The SDK (≥ 1.0) targets the Stripe-style v2 wire format (snake_case + Unix seconds + `{ data, ... }` envelopes) but exposes an idiomatic camelCase TS surface — the legacy `success: true` envelope flag is gone, the SDK unwraps `data` for you. A few gotchas worth knowing up front:

- **List endpoints return objects, not raw arrays.** `getActivity`, `getDeposits`, `getIntents`, and `getMarketSummary` all return a paginated envelope like `{ events, count, hasMore, limit, offset, filters }`. Iterate over `.events` / `.deposits` / `.intents` / `.markets`, not the top-level result.

- **`getDeposits` and `getIntents` require at least one filter.** The SDK throws a `ValidationError` with `code: "missing_filter"` client-side if you call them with none:
  - `getDeposits`: needs one of `depositor`, `delegate`, `platform`, `currency`
  - `getIntents`: needs one of `owner`, `recipient`, `verifier`, `depositId`, `status`

- **Currency resolution on deposits.** Deposit responses expose both the raw bytes32 hash and the resolved ISO code: use `market.currency` / `deposit.currencies[].currency` (e.g. `"GBP"`), not `market.currencyCode` / `deposit.currencies[].currencyCode` (e.g. `0xc4ae21...`). Call `getCurrencies()` if you need to build your own hash→code map.

- **Timestamps may be Unix seconds.** `ApiKeyInfo.createdAt`, `ApiKeyInfo.lastUsedAt`, and `freeCreditsResetAt` are typed `number | string` — v2 servers emit Unix seconds (integer), the v1-compat path still emits ISO strings. Convert with `Number(value) * 1000` when you need a JS `Date`.

- **`getTimeseries` returns `buckets: TimeseriesBucket[] | null`.** Single global series populates `buckets`; `groupBy` requests populate `series` instead. Always default with `data.buckets ?? []` before iterating.

- **`getProtocolSummary` is overloaded.** Calling with no args returns the legacy `InvestorAnalyticsSummary` (`mtd`, `allTime`, ...). Pass `{ from, to, range, compare }` to get the windowed `{ window, summary, composition, comparison }` payload.

## Core patterns

### Protocol overview
```typescript
const summary = await client.getProtocolSummary();
// { mtd: { settledVolumeUsd, activeLiquidityUsd, activeDeposits, ... }, allTime: { ... } }
```

### Exchange rates
```typescript
const rates = await client.getMarketSummary({ currency: "EUR" });
// Rate stats per platform/currency pair: best rate, average, sample size
```

### Live orderbook
```typescript
const orderbook = await client.getOrderbook({ currency: "GBP" });
// Orderbook grouped by rate level: rate, totalLiquidity, depositCount
```

### Maker portfolio
```typescript
const maker = await client.getMaker("0xMakerAddress");
// Deposits, profit, APR, allocation breakdown, active currencies
```

### Deposit detail
```typescript
const deposit = await client.getDeposit("42");
// Full deposit with intents, payment methods, currencies, status
```

### Live activity
```typescript
const { events, count, hasMore } = await client.getActivity({
  type: "intent_fulfilled",
  limit: 20,
});
// getActivity returns { events, count, hasMore, limit, offset, filters }
// — iterate over `events`, not the top-level result.
for (const event of events) {
  console.log(event.type, event.amountUsd, event.currency);
}
```

### Vault analytics
```typescript
const vaults = await client.getVaultsOverview();
// All vaults with AUM, fees, fill count, daily snapshots
```

### Webhook subscriptions

```typescript
import type { WebhookEventName } from "@peerlytics/sdk";

const events: WebhookEventName[] = [
  "deposit.created",
  "intent.signaled",
  "intent.fulfilled",
  "deposit.rate_updated",
];
const { secret } = await client.createWebhook({ url: "https://example.com/peerlytics", events });
// Save `secret` once — it is never returned again. Verify deliveries with HMAC-SHA256
// over `${timestamp}.${rawBody}` (see peerlytics/webhook-receiver.ts for the reference).
```

Canonical webhook event names (SDK ≥ 1.0): `deposit.created`, `intent.signaled`, `intent.fulfilled`, `deposit.rate_updated`. Legacy aliases (`intent.created`, `intent.filled`, `rate.updated`) are still accepted on registration but normalized server-side.

## Full method reference

Analytics:
- `getProtocolSummary()` — protocol MTD/QTD/YTD/all-time volume, liquidity, deposits
- `getLeaderboard({ limit?, offset? })` — top makers/takers by volume, APR, profit
- `getProtocolOverview(range)` — full analytics overview for mtd, 3mtd, ytd, all

Market:
- `getMarketSummary({ currency?, platform?, includeRates?, limit?, offset? })` — rate stats per pair
- `getOrderbook({ currency?, platform?, minSize? })` — live orderbook by rate level

Explorer:
- `getDeposit(id, { limit?, offset? })` — deposit detail with intents
- `getDeposits({ depositor?, delegate?, platform?, currency?, status?, accepting?, limit?, offset? })` — query deposits. **Requires at least one of `depositor`, `delegate`, `platform`, `currency`** (throws `ValidationError` otherwise). Returns `{ deposits, count, hasMore, ... }`.
- `getIntent(hash)` — intent detail
- `getIntents({ owner?, recipient?, verifier?, depositId?, status?, limit?, offset? })` — query intents. **Requires at least one of `owner`, `recipient`, `verifier`, `depositId`, `status`**. Returns `{ intents, count, hasMore, ... }`.
- `getAddress(address, { limit?, offset? })` — address profile with stats
- `getMaker(address)` — maker portfolio with allocations and profit
- `getVerifier(address, { limit?, offset? })` — verifier stats and breakdown
- `getVault(id, { days? })` — vault detail with snapshots
- `search(query, { type?, role?, limit?, offset? })` — multi-type search

Activity:
- `getActivity({ type?, depositId?, address?, rateManagerId?, since?, limit?, offset? })` — live protocol events. Returns `{ events, count, hasMore, ... }` — iterate over `.events`, not the top-level result.
- `streamActivity({ type?, rateManagerId?, since?, intervalMs?, limit? }, { signal? })` — SSE real-time event stream (returns ReadableStream<LiveEvent>)

History:
- `getMakerHistory(address)` — maker historical stats
- `getTakerHistory(address)` — taker historical stats

Metadata:
- `getCurrencies()` — supported fiat currencies
- `getPlatforms()` — supported payment platforms

Vaults:
- `getVaultsOverview()` — all vaults with AUM, fees, snapshots
- `getVault(id, { days? })` — vault detail with snapshots

Account & keys (SDK ≥ 1.0 takes the opaque `id` from `listKeys()`, not the raw key):
- `listKeys()` — list API keys; each entry exposes `id` (sha256 of the raw key) for use below
- `createKey(label?)` — create key (hits dedicated `POST /account/keys`)
- `rotateKey(idOrKey)` — rotate key; accepts either the opaque `id` or the raw key
- `deleteKey(id)` — delete key by `id` from `listKeys()` (raw key is no longer accepted)
- `getCredits()` — credit balance, free-tier window, and purchase history
- `createCheckout(pkg)` — purchase credits (`"starter" | "growth" | "scale"`)

Webhooks (SDK ≥ 1.0):
- `listWebhooks()` — list registered endpoints
- `createWebhook({ url, events, label? })` — register endpoint; returns the secret once
- `updateWebhook(id, { status })` — pause/resume an endpoint
- `deleteWebhook(id)` — unregister

## Error handling

```typescript
import { PeerlyticsError, RateLimitError, NotFoundError, ValidationError } from "@peerlytics/sdk";

try {
  const data = await client.getMaker(address);
} catch (err) {
  if (err instanceof NotFoundError) console.log("Address not found");
  if (err instanceof RateLimitError) console.log(`Rate limited, retry in ${err.retryAfter}s`);
  if (err instanceof ValidationError) console.log(`Bad request: ${err.code} — ${err.message}`);
  if (err instanceof PeerlyticsError) console.log(`HTTP ${err.status}: ${err.message}`);
}
```

`ValidationError` covers both server-returned 400s (e.g. `invalid_range`, `unknown_platform`) and client-side checks (e.g. `missing_filter` on `getDeposits`/`getIntents` with no filters).

## Links

- API docs: https://peerlytics.xyz/developers
- npm: https://www.npmjs.com/package/@peerlytics/sdk
- OpenAPI spec: https://peerlytics.xyz/api/openapi
- llms.txt: https://peerlytics.xyz/llms.txt
- Starters: https://github.com/ADWilkinson/usdctofiat-peerlytics-starters
