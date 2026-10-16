import type { ReactNode } from "react";

const tones = {
  ok: "c-ok",
  pr: "c-pr",
  mu: "c-mu",
  w: "c-w",
  p: "c-p",
  a: "c-a",
  x: "c-x",
} as const;

export function Chip({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

export function orderTone(status: string) {
  if (status === "awaiting_payment") return "w" as const;
  if (status === "processing") return "p" as const;
  if (status === "needs_attention") return "a" as const;
  if (status === "active") return "ok" as const;
  if (status === "cancelled") return "x" as const;
  return "mu" as const;
}
