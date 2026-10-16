export function usd(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function pkr(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value)}`;
}

export function moneyRound(value: number) {
  return Math.round(value * 100) / 100;
}

export type CartItem = {
  domain: string;
  years: number;
  premium: boolean;
  duration: number;
  sellBundle: number;
  sellYear1: number;
  sellExtraYear: number;
};

export function lineTotal(item: CartItem) {
  const duration = item.duration || 1;
  if (item.premium) {
    const extra = Math.max(0, item.years - duration);
    return moneyRound((item.sellBundle || item.sellYear1) + item.sellExtraYear * extra);
  }
  return moneyRound(item.sellYear1 + item.sellExtraYear * Math.max(0, item.years - 1));
}
