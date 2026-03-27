# peerlytics-starter

TypeScript examples for the [Peerlytics API](https://peerlytics.xyz/developers). Query ZKP2P P2P protocol data on Base: rates, orderbooks, maker portfolios, and live activity.

## Quick start

```bash
git clone https://github.com/ADWilkinson/peerlytics-starter.git
cd peerlytics-starter
npm install
export PEERLYTICS_API_KEY=pk_live_your_key_here  # get one at peerlytics.xyz/developers
npx tsx volume-dashboard.ts
```

## Examples

| Script | What it does |
|--------|-------------|
| [`volume-dashboard.ts`](volume-dashboard.ts) | Protocol stats, liquidity, top 5 makers and takers |
| [`rate-monitor.ts`](rate-monitor.ts) | Polls rates for a currency, alerts when they cross a threshold |
| [`orderbook-snapshot.ts`](orderbook-snapshot.ts) | Orderbook depth across currencies with bar charts |
| [`maker-report.ts`](maker-report.ts) | Portfolio report for a maker address (deposits, profit, APR) |
| [`live-activity.ts`](live-activity.ts) | Real-time protocol events, color-coded by type |
| [`x402-agent.ts`](x402-agent.ts) | Walks through the x402 pay-per-request flow (no key needed) |

Each script is self-contained. Run any with `npx tsx <file>.ts`.

## Auth

Two ways to authenticate:

**API key** (recommended). Every key includes 1,000 free requests/month. Generate one at [peerlytics.xyz/developers](https://peerlytics.xyz/developers?tab=account) or programmatically via `client.createKey()`, then:

```bash
export PEERLYTICS_API_KEY=pk_live_your_key_here
```

**x402** (keyless). Pay per request with USDC on Base. No account, no key. See `x402-agent.ts` for the full flow.

## Config

```bash
cp .env.example .env
```

| Variable | Default | Script |
|----------|---------|--------|
| `PEERLYTICS_API_KEY` | _(required)_ | all except x402-agent |
| `CURRENCY` | `GBP` | rate-monitor |
| `CURRENCIES` | `GBP,EUR,BRL,TRY,NGN` | orderbook-snapshot |
| `THRESHOLD` | `1.02` | rate-monitor |
| `POLL_SECONDS` | `60` / `10` | rate-monitor, live-activity |
| `EVENT_TYPE` | _(all)_ | live-activity |

## SDK

All examples use [`@peerlytics/sdk`](https://www.npmjs.com/package/@peerlytics/sdk):

```ts
import { Peerlytics } from "@peerlytics/sdk";
const p = new Peerlytics({ apiKey: "pk_live_..." });
```

| Method | Returns |
|--------|---------|
| `getSummary()` | Protocol volume, liquidity, deposit count, spreads |
| `getLeaderboard({ limit? })` | Top makers/takers by volume, APR, profit |
| `getMarketSummary({ currency? })` | Rate stats per platform/currency pair |
| `getOrderbook({ currency? })` | Live orderbook grouped by rate level |
| `getDeposit(id)` | Single deposit with intents and payment methods |
| `getAddress(address)` | Address profile with deposits, intents, stats |
| `getMaker(address)` | Maker portfolio with allocations and profit |
| `search(query)` | Search by address, ENS, deposit ID |
| `getActivity({ type?, limit? })` | Protocol events (signals, fills, rate updates) |
| `getMakerHistory(address)` | Historical maker performance |
| `getCurrencies()` | Supported fiat currencies |
| `getPlatforms()` | Supported payment platforms |
| `getVaultsOverview()` | All vaults with AUM, fees, snapshots |

Full reference on [npm](https://www.npmjs.com/package/@peerlytics/sdk).

## For agents

If you're building an autonomous agent or integrating with an LLM:

- **llms.txt** at `https://peerlytics.xyz/llms.txt` has the full API surface in a format agents can parse
- **OpenAPI spec** at `https://peerlytics.xyz/api/openapi` for structured endpoint discovery
- **x402** lets agents pay per request with USDC on Base, no key management needed

## Links

- [peerlytics.xyz/developers](https://peerlytics.xyz/developers)
- [@peerlytics/sdk on npm](https://www.npmjs.com/package/@peerlytics/sdk)
- [OpenAPI spec](https://peerlytics.xyz/api/openapi?download=1)
- [llms.txt](https://peerlytics.xyz/llms.txt)
- [zkp2p.xyz](https://zkp2p.xyz)

## License

MIT
