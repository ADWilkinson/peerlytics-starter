---
name: integrate-usdctofiat-offramp
description: Integrate the @usdctofiat/offramp SDK into a dApp to add USDC-to-fiat offramp functionality. Use when asked to add an offramp, sell USDC for fiat, integrate USDCtoFiat, or build a deposit flow.
---

# Integrate USDCtoFiat Offramp

## Overview

Guide the user to integrate `@usdctofiat/offramp` v1.0 into their dApp. The SDK has 3 functions and 2 const objects. No class, no constructor.

## Install

```bash
bun add @usdctofiat/offramp
```

## Core pattern

```typescript
import { offramp, PLATFORMS, CURRENCIES } from "@usdctofiat/offramp";

const result = await offramp(walletClient, {
  amount: "100",
  platform: PLATFORMS.REVOLUT,
  currency: CURRENCIES.EUR,
  identifier: "alice",
});
// { depositId: "362", txHash: "0x...", resumed: false }
```

## React pattern

```typescript
import { useOfframp } from "@usdctofiat/offramp/react";
import { PLATFORMS, CURRENCIES, type OfframpError } from "@usdctofiat/offramp";

function SellButton({ walletClient }: { walletClient: WalletClient }) {
  const { offramp, step, isLoading, error, reset } = useOfframp();

  const handleSell = async () => {
    try {
      await offramp(walletClient, {
        amount: "100",
        platform: PLATFORMS.REVOLUT,
        currency: CURRENCIES.EUR,
        identifier: "alice",
      });
    } catch (err) {
      const e = err as OfframpError;
      if (e.code === "USER_CANCELLED") return;
    }
  };

  if (step && step !== "done") return <p>{step}...</p>;
  return <button onClick={handleSell} disabled={isLoading}>Sell USDC</button>;
}
```

## Full API

```typescript
import { offramp, deposits, close, PLATFORMS, CURRENCIES } from "@usdctofiat/offramp";

// Create deposit + delegate (resumable — retries delegation if undelegated deposit exists)
await offramp(walletClient, params, onProgress?);

// List deposits (read-only, no wallet)
await deposits("0xAddress");

// Close and withdraw
await close(walletClient, "362");

// Platform data
PLATFORMS.REVOLUT.name                     // "Revolut"
PLATFORMS.REVOLUT.currencies               // ["USD", "EUR", ...]
PLATFORMS.REVOLUT.identifier.label         // "Revtag"
PLATFORMS.REVOLUT.identifier.placeholder   // "revtag (no @)"
PLATFORMS.REVOLUT.identifier.help          // "Revtag without @ (must be public)"
PLATFORMS.REVOLUT.validate("@alice")       // { valid: true, normalized: "alice" }

// Currency data
CURRENCIES.EUR.symbol      // "€"
CURRENCIES.EUR.name        // "Euro"
CURRENCIES.EUR.countryCode // "eu"
```

## Resumable flow

`offramp()` is idempotent. Before creating a new deposit, it checks for an existing undelegated deposit. If found, it skips to delegation. This handles:
- Browser crash after deposit but before delegation
- Failed delegation retry
- Any interrupted flow

Just call `offramp()` again.

## Error handling

```typescript
import { OfframpError } from "@usdctofiat/offramp";

try {
  await offramp(walletClient, params);
} catch (err) {
  if (err instanceof OfframpError) {
    if (err.code === "USER_CANCELLED") return;
    // For any failure: just call offramp() again to resume
    console.error(err.code, err.step, err.message);
  }
}
```

Error codes: `VALIDATION`, `APPROVAL_FAILED`, `REGISTRATION_FAILED`, `DEPOSIT_FAILED`, `CONFIRMATION_FAILED`, `DELEGATION_FAILED`, `USER_CANCELLED`, `UNSUPPORTED`

## Constraints

- Base network only (chain ID 8453)
- Minimum deposit: 1 USDC
- Requires a viem `WalletClient` with an account
- All deposits delegate to the Delegate vault (mandatory)
- Rate management handled by vault oracle

## Links

- npm: https://www.npmjs.com/package/@usdctofiat/offramp
- Starters: https://github.com/ADWilkinson/usdctofiat-peerlytics-starters
- App: https://usdctofiat.xyz
