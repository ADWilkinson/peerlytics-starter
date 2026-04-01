const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdPreciseFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export function formatCompactNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  return compactFormatter.format(value);
}

export function formatUsd(
  value: number | null | undefined,
  precise = false,
): string {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  return precise ? usdPreciseFormatter.format(value) : usdFormatter.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  return numberFormatter.format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  return `${percentFormatter.format(value)}%`;
}

function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = { GBP: "£", USD: "$", EUR: "€" };
  return symbols[code] ?? "";
}

export function formatRate(
  value: number | null | undefined,
  currencyCode?: string,
): string {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  const symbol = currencyCode ? getCurrencySymbol(currencyCode) : "";
  return `${symbol}${value.toFixed(3)}`;
}

export function shortenAddress(value: string, visible = 4): string {
  if (value.length <= visible * 2 + 2) {
    return value;
  }

  return `${value.slice(0, visible + 2)}...${value.slice(-visible)}`;
}

export function formatRelativeTime(value: string | number): string {
  const timestamp = typeof value === "number" ? value : Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return "--";
  }

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const minutes = Math.round(diffSeconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(diffSeconds) < 60) {
    return relativeFormatter.format(diffSeconds, "second");
  }

  if (Math.abs(minutes) < 60) {
    return relativeFormatter.format(minutes, "minute");
  }

  if (Math.abs(hours) < 24) {
    return relativeFormatter.format(hours, "hour");
  }

  return relativeFormatter.format(days, "day");
}
