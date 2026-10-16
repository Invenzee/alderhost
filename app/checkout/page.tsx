"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/chip";
import { ContactFields, emptyContact, ContactInput } from "@/components/contact-fields";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { pkr, usd } from "@/lib/format";

type Quote = {
  fx: number;
  usdSell: number;
  discount: number;
  pkr: number;
  items: { domain: string; years: number; premium: boolean; sell: number }[];
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCart();
  const session = useSession();
  const [contact, setContact] = useState<ContactInput>(emptyContact);
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const payload = { items: items.map((item) => ({ domain: item.domain, years: item.years })), couponCode };

  const quote = useQuery({
    queryKey: ["quote", payload],
    enabled: items.length > 0 && Boolean(session.data?.user),
    queryFn: () => api<Quote>("/coupons/preview", { method: "POST", body: payload }),
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await api<{ order: { id: string } }>("/checkout", { method: "POST", body: { ...payload, contact } });
      clear();
      router.push(`/orders/${result.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setPending(false);
    }
  }

  if (!session.isLoading && !session.data?.user) {
    return (
      <main className="page">
        <div className="card narrow gate">
          <h1 className="title">Sign in to check out</h1>
          <p className="lead">Search stays open. An account is required before an order is created.</p>
          <div style={{ marginTop: 16 }}>
            <Button nativeButton={false} render={<Link href="/login?next=/checkout" />}>Sign in</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="pr">
        <Link href="/cart">Cart</Link>
        <span className="a">Checkout</span>
        <span>Receipt</span>
      </div>
      <h1 className="title">Checkout</h1>
      <div className="bn" style={{ marginTop: 14 }}>
        Registration happens only after this order is marked paid. Registry registrations are not refundable after they succeed.
      </div>
      {items.length === 0 ? <p className="lead">Your cart is empty.</p> : (
        <form onSubmit={onSubmit}>
          <div className="cols">
            <div className="stack">
              {quote.data ? (
                <div className="card">
                  {quote.data.items.map((item) => (
                    <div className="line" key={item.domain}>
                      <span>
                        {item.domain} · {item.years} year{item.years > 1 ? "s" : ""}
                        {item.premium ? <> · <Chip tone="pr">premium</Chip></> : null}
                      </span>
                      <b>{usd(item.sell)}</b>
                    </div>
                  ))}
                  {quote.data.discount > 0 ? (
                    <div className="line discount">
                      <span>Discount {usd(quote.data.discount)}</span>
                      <b>−{usd(quote.data.discount)}</b>
                    </div>
                  ) : null}
                  <div className="line">
                    <span className="big">Total</span>
                    <span className="big">{usd(quote.data.usdSell)} · {pkr(quote.data.pkr)}</span>
                  </div>
                </div>
              ) : null}
              <div className="card">
                <label>
                  Coupon
                  <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} />
                </label>
              </div>
            </div>
            <ContactFields value={contact} onChange={setContact} />
          </div>
          {quote.error ? <p className="er">{quote.error.message}</p> : null}
          {error ? <p className="er">{error}</p> : null}
          <div className="fl" style={{ marginTop: 16, justifyContent: "flex-start" }}>
            <Button className="tight" type="submit" disabled={pending}>
              {pending ? <><span className="sp" /> Placing order…</> : "Place order"}
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
