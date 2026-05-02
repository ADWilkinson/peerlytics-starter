# Templates

Scaffolds for `@usdctofiat/offramp`. Each template is a working app with the wallet flow wired and a real `offramp()` call in place — drop in your `integratorId` and run.

## Use the CLI

```bash
npx create-offramp-app@latest my-offramp --template=next
```

The CLI prompts for your `integratorId` and substitutes it into the template files. Templates: `next`, `vite`, `telegram-bot`. Default is `next`.

## Templates

| Template | Stack | Best for |
|---|---|---|
| [`next`](./next) | Next.js 16 App Router + Privy | Production web apps with embedded wallet auth |
| [`vite`](./vite) | Vite + React 19 + viem | Lean SPA without Next conventions |
| [`telegram-bot`](./telegram-bot) | Node 22 + grammy + viem | Server-side maker bots with a managed wallet |

## What ships in each template

- `package.json` pinned to the latest `@usdctofiat/offramp` v2.x
- A working `offramp()` call wired to `PLATFORMS.VENMO` / `CURRENCIES.USD` — edit to taste
- Your `integratorId` baked in via the CLI prompt
- A `TODO_SET_REFERRAL_ID` placeholder for partner attribution — replace before shipping
- Type-checked TypeScript
- A README inside the template covering run, deploy, and customize

## Upgrading from v1.x

v2.0.0 was a breaking change: PayPal makers now use the `paypal.me` username (not email), maker registration moved to `POST /v2/makers/create`, and PayPal + Wise must drive the Peer browser-extension handshake before the first deposit. These templates already use the v2 surface (`useOfframp` + `usePeerExtensionRegistration`). For forks of older templates, see the [SDK v2 migration guide](https://github.com/ADWilkinson/galleonlabs-zkp2p/blob/main/packages/offramp-sdk/CHANGELOG.md#200---2026-04-24).

## Manual install (no CLI)

Copy a template directory into your project, replace `__INTEGRATOR_ID__` with your integrator ID, and `npm install`.

## See also

- SDK reference: [usdctofiat.xyz/developers/api](https://usdctofiat.xyz/developers/api)
- Quickstart: [usdctofiat.xyz/developers/docs/quickstart](https://usdctofiat.xyz/developers/docs/quickstart)
- Webhook contract: [usdctofiat.xyz/developers/docs/webhooks](https://usdctofiat.xyz/developers/docs/webhooks)
- One-shot scripts that don't need scaffolding: [`/usdctofiat`](../usdctofiat) at the repo root
