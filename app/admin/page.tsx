"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Chip, orderTone } from "@/components/chip";
import { usd } from "@/lib/format";
import { useSession } from "@/lib/auth";

type Summary = { balance: number; lowBalance: boolean; awaitingFunds: number; fx: number };
type AdminOrder = {
  id: string;
  status: string;
  usdSell: number;
  usdCost?: number;
  margin?: number;
  items: { domain: string; action: string }[];
};
type Tld = {
  tld: string;
  registration: number;
  renew: number;
  transfer: number;
  markupPercent: number;
  premiumMarkupPercent: number;
};
type Coupon = { _id: string; code: string; type: string; amount: number; active: boolean };

const tabs = ["orders", "pricing", "fx", "coupons"] as const;

export default function AdminPage() {
  const session = useSession();
  const [tab, setTab] = useState<(typeof tabs)[number]>("orders");
  const summary = useQuery({
    queryKey: ["admin-summary"],
    enabled: session.data?.user?.role === "admin",
    queryFn: () => api<Summary>("/admin/summary"),
  });

  if (session.data && session.data.user?.role !== "admin") {
    return (
      <main className="page">
        <div className="card">Admin only</div>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="title" style={{ marginBottom: 14 }}>Admin</h1>
      {summary.data?.lowBalance ? (
        <div className="bn er" role="alert">
          NameSilo balance is {usd(summary.data.balance)}. {summary.data.awaitingFunds} order{summary.data.awaitingFunds === 1 ? "" : "s"} waiting on funds.
        </div>
      ) : summary.data ? (
        <div className="card">
          <span className="lead">NameSilo balance</span> <span className="bal">{usd(summary.data.balance)}</span>
        </div>
      ) : null}
      {summary.error ? <p className="er">{summary.error.message}</p> : null}
      <div className="tabs">
        {tabs.map((item) => (
          <button key={item} type="button" className={tab === item ? "on" : ""} onClick={() => setTab(item)}>
            {item === "fx" ? "FX" : item}
          </button>
        ))}
      </div>
      {tab === "orders" ? <OrdersPanel /> : null}
      {tab === "pricing" ? <PricingPanel /> : null}
      {tab === "fx" ? <FxPanel current={summary.data?.fx} /> : null}
      {tab === "coupons" ? <CouponsPanel /> : null}
    </main>
  );
}

function OrdersPanel() {
  const queryClient = useQueryClient();
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => api<{ orders: AdminOrder[] }>("/admin/orders") });
  const [confirmation, setConfirmation] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function act(id: string, action: "mark-paid" | "cancel" | "retry") {
    setError("");
    try {
      await api(`/admin/orders/${id}/${action}`, {
        method: "POST",
        body: action === "mark-paid" ? { confirmation: confirmation[id] || "" } : {},
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <div className="stack">
      {error ? <p className="er">{error}</p> : null}
      {orders.data?.orders.map((order) => {
        const expected = order.items.map((item) => item.domain).join(", ");
        return (
          <article key={order.id} className="card">
            <div className="fl" style={{ alignItems: "center" }}>
              <b className="dn" style={{ flex: "2 1 200px" }}>{expected}</b>
              <Chip tone={orderTone(order.status)}>{order.status}</Chip>
              <span style={{ flex: "2 1 200px" }}>
                Sell {usd(order.usdSell)}
                {order.usdCost != null ? <> · cost {usd(order.usdCost)} · <b style={{ color: "var(--ok)" }}>margin {usd(order.margin)}</b></> : null}
              </span>
            </div>
            {order.status === "awaiting_payment" ? (
              <div className="fl" style={{ marginTop: 12 }}>
                <input
                  aria-label="Confirmation"
                  placeholder={expected}
                  value={confirmation[order.id] || ""}
                  onChange={(event) => setConfirmation({ ...confirmation, [order.id]: event.target.value })}
                />
                <Button className="tight" onClick={() => act(order.id, "mark-paid")}>Mark paid</Button>
              </div>
            ) : null}
            <div className="fl" style={{ marginTop: 12, justifyContent: "flex-start" }}>
              <Button className="tight" variant="outline" onClick={() => act(order.id, "retry")}>Retry</Button>
              <Button className="tight" variant="destructive" onClick={() => act(order.id, "cancel")}>Cancel</Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PricingPanel() {
  const queryClient = useQueryClient();
  const pricing = useQuery({ queryKey: ["admin-pricing"], queryFn: () => api<{ tlds: Tld[] }>("/admin/pricing") });
  const [error, setError] = useState("");

  async function refresh() {
    setError("");
    try {
      await api("/admin/pricing/refresh", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    }
  }

  async function save(row: Tld, markupPercent: number, premiumMarkupPercent: number) {
    setError("");
    try {
      await api(`/admin/pricing/${row.tld}`, { method: "PUT", body: { markupPercent, premiumMarkupPercent } });
      await queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save markup");
    }
  }

  return (
    <div className="stack">
      <div><Button variant="outline" onClick={refresh}>Refresh wholesale prices</Button></div>
      {error ? <p className="er">{error}</p> : null}
      {pricing.data?.tlds.map((row) => (
        <TldEditor key={row.tld} row={row} onSave={save} />
      ))}
    </div>
  );
}

function TldEditor({ row, onSave }: { row: Tld; onSave: (row: Tld, markup: number, premium: number) => void }) {
  const [markup, setMarkup] = useState(String(row.markupPercent));
  const [premium, setPremium] = useState(String(row.premiumMarkupPercent));
  return (
    <form
      className="card fl"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(row, Number(markup), Number(premium));
      }}
    >
      <div>
        <p className="dn">.{row.tld}</p>
        <p className="lead sm">Reg {usd(row.registration)} · renew {usd(row.renew)}</p>
      </div>
      <label>
        Markup %
        <input value={markup} onChange={(event) => setMarkup(event.target.value)} />
      </label>
      <label>
        Premium %
        <input value={premium} onChange={(event) => setPremium(event.target.value)} />
      </label>
      <Button type="submit">Save</Button>
    </form>
  );
}

function FxPanel({ current }: { current?: number }) {
  const queryClient = useQueryClient();
  const [rate, setRate] = useState(current ? String(current) : "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (current != null) setRate(String(current));
  }, [current]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/admin/fx", { method: "PUT", body: { usdToPkr: Number(rate) } });
      await queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the rate");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 420 }}>
      <p className="lead" style={{ marginTop: 0 }}>PKR display rate. Orders lock the rate at checkout. Current {current ?? "—"}.</p>
      <div className="fl" style={{ justifyContent: "flex-start" }}>
        <div style={{ flex: "0 0 160px" }}>
          <input aria-label="PKR rate" value={rate} onChange={(event) => setRate(event.target.value)} />
        </div>
        <Button className="tight" type="submit">Save rate</Button>
      </div>
      {error ? <p className="er">{error}</p> : null}
    </form>
  );
}

function CouponsPanel() {
  const queryClient = useQueryClient();
  const coupons = useQuery({ queryKey: ["coupons"], queryFn: () => api<{ coupons: Coupon[] }>("/admin/coupons") });
  const [form, setForm] = useState({ code: "", type: "percent", amount: "10" });
  const [error, setError] = useState("");

  async function create(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/admin/coupons", { method: "POST", body: { ...form, amount: Number(form.amount) } });
      setForm({ code: "", type: "percent", amount: "10" });
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the coupon");
    }
  }

  async function toggle(coupon: Coupon) {
    await api(`/admin/coupons/${coupon._id}`, { method: "PATCH", body: { active: !coupon.active } });
    await queryClient.invalidateQueries({ queryKey: ["coupons"] });
  }

  return (
    <div className="card">
      <form onSubmit={create} className="fl">
        <label>
          Code
          <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
        </label>
        <label>
          Type
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed USD</option>
          </select>
        </label>
        <label>
          Amount
          <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        </label>
        <Button type="submit">Create</Button>
      </form>
      {error ? <p className="er">{error}</p> : null}
      {coupons.data?.coupons.map((coupon) => (
        <div className="rw pair" key={coupon._id}>
          <span className="mono">
            {coupon.code} · {coupon.type} {coupon.amount} · {coupon.active ? <Chip tone="ok">active</Chip> : <Chip tone="mu">off</Chip>}
          </span>
          <Button variant="outline" onClick={() => toggle(coupon)}>{coupon.active ? "Disable" : "Enable"}</Button>
        </div>
      ))}
    </div>
  );
}
