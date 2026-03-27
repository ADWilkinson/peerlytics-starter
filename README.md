# peerlytics-starter

Example scripts for the [Peerlytics API](https://peerlytics.xyz/developers) and [@peerlytics/sdk](https://www.npmjs.com/package/@peerlytics/sdk).

## Quick start

```bash
npm install
npx tsx rate-monitor.ts
```

## Scripts

| Script | Description |
|--------|-------------|
| `rate-monitor.ts` | Monitor P2P rates and alert on threshold crossings |
| `volume-dashboard.ts` | Terminal dashboard with protocol stats and leaderboard |
| `x402-agent.ts` | Pay-per-request flow without an API key (USDC on Base) |

## Authentication

Two options:

1. **API Key** -- set `PEERLYTICS_API_KEY` env var (get one at [peerlytics.xyz/developers](https://peerlytics.xyz/developers?tab=account))
2. **x402** -- pay per request with USDC on Base, no key needed ([docs](https://peerlytics.xyz/developers#docs-auth))

## Links

- [API documentation](https://peerlytics.xyz/developers)
- [Interactive API reference](https://peerlytics.xyz/docs)
- [SDK on npm](https://www.npmjs.com/package/@peerlytics/sdk)
- [OpenAPI spec](https://peerlytics.xyz/api/openapi?download=1)
