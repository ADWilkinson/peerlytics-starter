# peerlytics-starter

Runnable TypeScript examples for the [Peerlytics API](https://peerlytics.xyz/developers) -- protocol analytics, orderbook data, and maker tools for the [ZKP2P](https://zkp2p.xyz) P2P network on Base.

## Quick start

```bash
git clone https://github.com/ADWilkinson/peerlytics-starter.git
cd peerlytics-starter
npm install
npx tsx volume-dashboard.ts
```

## Examples

| Script | Description | Auth |
|--------|-------------|------|
| [`volume-dashboard.ts`](volume-dashboard.ts) | Protocol stats, liquidity, top 5 makers and takers | optional |
| [`rate-monitor.ts`](rate-monitor.ts) | Poll rates for a currency, alert on threshold crossings | optional |
| [`orderbook-snapshot.ts`](orderbook-snapshot.ts) | Live orderbook depth across currencies with bar charts | optional |
| [`maker-report.ts`](maker-report.ts) | Portfolio report for a maker: deposits, profit, APR, platforms | optional |
| [`live-activity.ts`](live-activity.ts) | Stream real-time protocol events with color-coded output | optional |
| [`x402-agent.ts`](x402-agent.ts) | Walk through the x402 pay-per-request flow (no key needed) | none |

Every script is self-contained. Run any of them with `npx tsx <script>.ts`.

## Authentication

| Method | Setup | Best for |
|--------|-------|----------|
| **Free tier** | Nothing -- works out of the box | Getting started, low volume |
| **API key** | `export PEERLYTICS_API_KEY=pk_live_...` | Production apps, higher rate limits |
| **x402** | Pay per request with USDC on Base | Autonomous agents, no credentials |

Get an API key at [peerlytics.xyz/developers](https://peerlytics.xyz/developers?tab=account).

## Environment variables

```bash
# Copy and edit
cp .env.example .env

# Or export directly
export PEERLYTICS_API_KEY=pk_live_your_key_here
```

| Variable | Default | Used by |
|----------|---------|---------|
| `PEERLYTICS_API_KEY` | _(free tier)_ | All scripts |
| `CURRENCY` | `GBP` | rate-monitor |
| `CURRENCIES` | `GBP,EUR,BRL,TRY,NGN` | orderbook-snapshot |
| `THRESHOLD` | `1.02` | rate-monitor |
| `POLL_SECONDS` | `60` / `10` | rate-monitor, live-activity |
| `EVENT_TYPE` | _(all)_ | live-activity |

## SDK reference

The examples use [`@peerlytics/sdk`](https://www.npmjs.com/package/@peerlytics/sdk). Key methods:

```ts
import { Peerlytics } from "@peerlytics/sdk";
const p = new Peerlytics({ apiKey: "pk_live_..." });
```

| Category | Method | Description |
|----------|--------|-------------|
| Analytics | `getSummary()` | Protocol volume, liquidity, deposits, spreads |
| Analytics | `getLeaderboard({ limit? })` | Top makers and takers by volume, APR, profit |
| Market | `getMarketSummary({ currency? })` | Rate stats per (platform, currency) pair |
| Market | `getOrderbook({ currency? })` | Live orderbook grouped by rate level |
| Explorer | `getDeposit(id)` | Deposit detail with intents and payment methods |
| Explorer | `getAddress(address)` | Address profile: deposits, intents, stats |
| Explorer | `getMaker(address)` | Maker portfolio: allocations, profit, APR |
| Explorer | `search(query)` | Multi-type search (address, ENS, deposit ID) |
| Activity | `getActivity({ type?, limit? })` | Live protocol events |
| History | `getMakerHistory(address)` | Maker historical performance |
| Metadata | `getCurrencies()` | Supported fiat currencies |
| Metadata | `getPlatforms()` | Supported payment platforms |
| Vaults | `getVaultsOverview()` | All vaults with AUM, fees, snapshots |

Full reference: [`@peerlytics/sdk` README](https://www.npmjs.com/package/@peerlytics/sdk)

## For AI agents

Point your agent at the Peerlytics `llms.txt` for API discovery:

```
https://peerlytics.xyz/llms.txt
```

Or use the OpenAPI spec directly:

```bash
curl https://peerlytics.xyz/api/openapi | jq
```

The x402 pay-per-request flow (`x402-agent.ts`) is designed for autonomous agents -- no API key management, just a wallet with USDC on Base.

## Links

- [API documentation](https://peerlytics.xyz/developers)
- [SDK on npm](https://www.npmjs.com/package/@peerlytics/sdk)
- [OpenAPI spec](https://peerlytics.xyz/api/openapi?download=1)
- [llms.txt](https://peerlytics.xyz/llms.txt)
- [ZKP2P protocol](https://zkp2p.xyz)

## License

MIT
