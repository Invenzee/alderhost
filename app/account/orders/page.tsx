"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Chip, orderTone } from "@/components/chip";
import { api } from "@/lib/api";
import { usd } from "@/lib/format";

type Order = { id: string; customerStatus: string; usdSell: number; createdAt: string; items: { domain: string }[] };

const labels: Record<string, string> = {
  awaiting_payment: "Waiting for payment",
  processing: "Processing",
  needs_attention: "Needs attention",
  active: "Active",
  cancelled: "Cancelled",
};

export default function AccountOrdersPage() {
  const orders = useQuery({ queryKey: ["orders"], queryFn: () => api<{ orders: Order[] }>("/orders") });

  return (
    <main className="page">
      <h1 className="title" style={{ marginBottom: 14 }}>Orders</h1>
      {orders.isFetching && !orders.data ? <p className="lead sm"><span className="sp" /> Loading…</p> : null}
      <div className="stack">
        {orders.data?.orders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="card" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span>
              <span className="dn">{order.items.map((item) => item.domain).join(", ")}</span>
              <br />
              <span className="lead">{usd(order.usdSell)}</span>
            </span>
            <Chip tone={orderTone(order.customerStatus)}>{labels[order.customerStatus] || order.customerStatus}</Chip>
          </Link>
        ))}
      </div>
      {orders.data?.orders.length === 0 ? <div className="card lead">No orders yet.</div> : null}
      {orders.error ? <p className="er">{orders.error.message}</p> : null}
    </main>
  );
}
