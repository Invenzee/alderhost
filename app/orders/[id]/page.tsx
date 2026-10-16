"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Chip, orderTone } from "@/components/chip";
import { pkr, usd } from "@/lib/format";

type OrderItem = { domain: string; action: string; years: number; premium: boolean; sellQuote: number };
type Order = {
  id: string;
  status: string;
  customerStatus: string;
  usdSell: number;
  pkr: number;
  fx: number;
  discount: number;
  couponCode: string;
  createdAt: string;
  items: OrderItem[];
};

const labels: Record<string, string> = {
  awaiting_payment: "Waiting for payment",
  processing: "Processing",
  needs_attention: "Needs attention",
  active: "Active",
  cancelled: "Cancelled",
};

const flow = ["awaiting_payment", "processing", "active"];

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const orderQuery = useQuery({
    queryKey: ["order", params.id],
    queryFn: () =>
      api<{ order: Order; paymentsMode: string; registerEnabled: boolean; wholesaleUsd?: number; confirmation: string }>(
        `/orders/${params.id}`
      ),
    refetchInterval: (query) => (query.state.data?.order.customerStatus === "processing" ? 5000 : false),
  });

  async function markPaid(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await api(`/orders/${params.id}/mark-paid`, { method: "POST", body: { confirmation } });
      await queryClient.invalidateQueries({ queryKey: ["order", params.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be recorded");
    } finally {
      setPending(false);
    }
  }

  async function cancel() {
    setError("");
    try {
      await api(`/orders/${params.id}/cancel`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["order", params.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel");
    }
  }

  const data = orderQuery.data;
  const order = data?.order;
  const step = order ? flow.indexOf(order.customerStatus) : -1;

  return (
    <main className="page">
      <Link href="/account/orders" className="btn g">← Orders</Link>
      <h1 className="title" style={{ margin: "8px 0 14px" }}>Order receipt</h1>
      {orderQuery.isFetching && !order ? <p className="lead sm"><span className="sp" /> Loading…</p> : null}
      {orderQuery.error ? <p className="er">{orderQuery.error.message}</p> : null}
      {order ? (
        <div className={order.customerStatus === "awaiting_payment" ? "cols" : "stack"}>
          <div className="stack">
            <div className="card">
              {step >= 0 ? (
                <div className="tm">
                  {["Waiting for payment", "Processing", "Active"].map((label, index) => (
                    <span key={label} className={index <= step ? "on" : ""}>{label}</span>
                  ))}
                </div>
              ) : null}
              <Chip tone={orderTone(order.customerStatus)}>{labels[order.customerStatus] || order.customerStatus}</Chip>
              <div className="bal" style={{ marginTop: 10 }}>{usd(order.usdSell)}</div>
              <p className="lead" style={{ margin: 0 }}>{pkr(order.pkr)} at {order.fx} PKR per USD</p>
              {order.couponCode ? <p className="lead sm" style={{ margin: "6px 0 0" }}>Coupon {order.couponCode} · saved {usd(order.discount)}</p> : null}
            </div>
            <div className="card table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Action</th>
                    <th>Years</th>
                    <th>Premium</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.domain}>
                      <td className="dn">{item.domain}</td>
                      <td>{item.action}</td>
                      <td>{item.years}</td>
                      <td>{item.premium ? <Chip tone="pr">Premium</Chip> : <span className="lead">No</span>}</td>
                      <td>{usd(item.sellQuote)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="lead sm">
              NameSilo emails the registrant to verify the contact. That message does not come from Alderhost. After a successful registration, the order cannot be refunded.
            </p>
          </div>
          {order.customerStatus === "awaiting_payment" ? (
            <div className="stack">
              {data?.paymentsMode === "test" ? (
                <form onSubmit={markPaid} className="card">
                  <h2>Mark as paid</h2>
                  <p className="er">
                    This spends real NameSilo account funds. Wholesale cost {usd(data.wholesaleUsd)}. Type {data.confirmation} to confirm.
                  </p>
                  {!data.registerEnabled ? <p className="lead sm">Registration is turned off until REGISTER_ENABLED is true.</p> : null}
                  <label style={{ marginTop: 12 }}>
                    Confirmation
                    <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={data.confirmation} />
                  </label>
                  <div className="fl" style={{ marginTop: 12, justifyContent: "flex-start" }}>
                    <Button className="tight" type="submit" disabled={pending || !data.registerEnabled}>
                      {pending ? <><span className="sp" /> Submitting…</> : "Mark as paid"}
                    </Button>
                  </div>
                </form>
              ) : null}
              <div>
                <Button variant="destructive" onClick={cancel}>Cancel unpaid order</Button>
              </div>
              {error ? <p className="er">{error}</p> : null}
            </div>
          ) : error ? <p className="er">{error}</p> : null}
        </div>
      ) : null}
    </main>
  );
}
