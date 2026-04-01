# Delegated USDC Offramp

A minimal Vite + React demo for delegated USDC sells on Base.

It keeps the surface area intentionally small:

- create a delegated deposit with `@usdctofiat/offramp`
- read the live orderbook through a tiny server-side `@peerlytics/sdk` proxy
- show only active deposits for the connected wallet
- cache orderbook responses in `sessionStorage` for the current browser session

## Stack

- Vite
- React 19
- TypeScript
- `@usdctofiat/offramp`
- `@peerlytics/sdk`
- Vercel

## Local development

```bash
npm install
cp .env.example .env.local
```

Set your server-side Peerlytics key:

```bash
PEERLYTICS_API_KEY=pk_live_...
```

Then run:

```bash
npm run dev
```

## Production build

```bash
npm run build
```

## Deploy to Vercel

Link the repo once:

```bash
vercel link
```

Add the server-side env:

```bash
vercel env add PEERLYTICS_API_KEY production
vercel env add PEERLYTICS_API_KEY preview
```

Deploy production:

```bash
vercel --prod
```

## Project structure

```text
api/
  orderbook.ts        # Vercel serverless orderbook proxy
server/
  peerlytics.ts       # shared Peerlytics server helper
src/
  App.tsx             # single-page demo UI
  styles.css          # visual system
  lib/
    format.ts         # formatting helpers
    wallet.ts         # injected wallet + Base helpers
scripts/
  deploy.sh           # claimable preview deploy helper
```

## Notes

- The orderbook key stays server-side in Vercel and is not exposed to the browser.
- The local Vite dev server mounts the same `/api/orderbook` path for parity with production.
- Deposits are filtered to `active` only.
- Older standalone SDK examples are still available in `peerlytics/` and `usdctofiat/` if you want more reference scripts.

## References

- [Offramp SDK on npm](https://www.npmjs.com/package/@usdctofiat/offramp)
- [Peerlytics SDK on npm](https://www.npmjs.com/package/@peerlytics/sdk)
- [Starter repo](https://github.com/ADWilkinson/usdctofiat-peerlytics-starters)
- [davyjones0x on X](https://x.com/davyjones0x)
