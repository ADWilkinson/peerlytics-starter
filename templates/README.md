# Templates

Scaffold-ready integrations for `@usdctofiat/offramp`. Each template is a working app with the wallet flow wired and a real `offramp()` call in place. Drop in your `integratorId` and ship.

## Use the CLI

```bash
npx create-offramp-app@latest my-offramp --template=next
```

The CLI prompts for your `integratorId` and substitutes it into the template files. Available templates: `next`, `vite`, `telegram-bot`. Default is `next`.

## Templates

| Template | Stack | Best for |
|---|---|---|
| [`next`](./next) | Next.js 16 App Router + Privy | Production web apps with embedded wallet auth |
| [`vite`](./vite) | Vite + React 19 + viem | Lean SPA without Next conventions |
| [`telegram-bot`](./telegram-bot) | Node 22 + grammy + viem | Server-side maker bots with a managed wallet |

## What ships in each template

- `package.json` pinned to `@usdctofiat/offramp` v2.x latest
- A working `offramp()` call wired to `PLATFORMS.VENMO` / `CURRENCIES.USD` (edit to taste)
- Your `integratorId` baked in via the CLI prompt
- A `TODO_SET_REFERRAL_ID` placeholder for partner attribution -- replace before shipping
- Type-checked TypeScript
- A README inside the template explaining how to run, deploy, and customize

## Upgrading from v1.x

The SDK shipped a breaking change with v2.0.0: PayPal makers now use the `paypal.me` username (not email), curator's maker registration moved to `POST /v2/makers/create`, and PayPal + Wise integrations need to drive the Peer browser-extension handshake before the first deposit. The templates above already use the v2 surface (`useOfframp` + `usePeerExtensionRegistration`). If you forked an older template, see the [SDK v2 migration guide](https://github.com/ADWilkinson/galleonlabs-zkp2p/blob/main/packages/offramp-sdk/CHANGELOG.md#200---2026-04-24).

## Manual install (no CLI)

If you'd rather not use the CLI, copy a template directory into your project root, replace `__INTEGRATOR_ID__` with your integrator ID, and `npm install`.

## See also

- SDK reference: [usdctofiat.xyz/developers/api](https://usdctofiat.xyz/developers/api)
- Quickstart: [usdctofiat.xyz/developers/docs/quickstart](https://usdctofiat.xyz/developers/docs/quickstart)
- Webhook contract: [usdctofiat.xyz/developers/docs/webhooks](https://usdctofiat.xyz/developers/docs/webhooks)
- Loose example files (one-shot scripts that don't need scaffolding): see [`/usdctofiat`](../usdctofiat) at the repo root
