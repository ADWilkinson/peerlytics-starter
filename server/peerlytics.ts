import { Peerlytics } from "@peerlytics/sdk";
import type { OrderbookCurrency } from "@peerlytics/sdk";

type SupportedPlatformId = "revolut" | "venmo";
type SupportedCurrencyCode = "GBP" | "USD" | "EUR";

export type OrderbookSnapshot = {
  orderbook: OrderbookCurrency | null;
  updatedAt: string;
};

const supportedRoutes: Record<SupportedPlatformId, readonly SupportedCurrencyCode[]> = {
  revolut: ["GBP", "USD", "EUR"],
  venmo: ["USD"],
};

let client: Peerlytics | null = null;
let activeApiKey = "";

export function getPeerlyticsApiKey(): string {
  const env =
    (
      globalThis as {
        process?: { env?: Record<string, string | undefined> };
      }
    ).process?.env ?? {};

  return env.PEERLYTICS_API_KEY?.trim() ?? env.VITE_PEERLYTICS_API_KEY?.trim() ?? "";
}

export function isSupportedRoute(
  platform: string,
  currency: string,
): platform is SupportedPlatformId {
  const allowedCurrencies = supportedRoutes[platform as SupportedPlatformId];

  return Boolean(allowedCurrencies?.includes(currency as SupportedCurrencyCode));
}

export async function fetchOrderbookSnapshot(
  platform: string,
  currency: string,
): Promise<OrderbookSnapshot> {
  if (!isSupportedRoute(platform, currency)) {
    throw new Error("Unsupported route.");
  }

  const nextApiKey = getPeerlyticsApiKey();

  if (!nextApiKey) {
    throw new Error("Missing PEERLYTICS_API_KEY.");
  }

  if (!client || activeApiKey !== nextApiKey) {
    activeApiKey = nextApiKey;
    client = new Peerlytics({ apiKey: nextApiKey });
  }

  const response = await client.getOrderbook({
    currency,
    platform,
  });

  return {
    orderbook:
      response.orderbooks.find((entry) => entry.currency === currency) ?? null,
    updatedAt: new Date().toISOString(),
  };
}
