"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/chip";
import { useCart } from "@/lib/cart";
import { lineTotal, usd } from "@/lib/format";

export default function CartPage() {
  const { items, remove, setYears } = useCart();
  const total = items.reduce((sum, item) => sum + lineTotal(item), 0);

  return (
    <main className="page">
      <h1 className="title">Cart</h1>
      <p className="lead">WHOIS privacy is included. Auto-renew is off. The final price is confirmed at checkout.</p>
      {items.length === 0 ? (
        <div className="card" style={{ marginTop: 18 }}>
          <p style={{ margin: "0 0 8px" }}>Your cart is empty.</p>
          <Link className="btn o" href="/">Search domains</Link>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 18, padding: "4px 18px 18px" }}>
          {items.map((item) => (
            <div className="rw" key={item.domain}>
              <span>
                <span className="dn">{item.domain}</span>
                {item.premium ? <span className="pk"><Chip tone="pr">Premium live quote</Chip></span> : null}
              </span>
              <label>
                Years
                <select value={item.years} onChange={(event) => setYears(item.domain, Number(event.target.value))}>
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((year) => (
                    <option key={year} value={year}>{year} year{year > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </label>
              <span className="big">{usd(lineTotal(item))}</span>
              <Button variant="ghost" onClick={() => remove(item.domain)}>Remove</Button>
            </div>
          ))}
          <div className="fl" style={{ justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--ln)", paddingTop: 14 }}>
            <span className="big" style={{ flex: 1 }}>Estimated {usd(total)}</span>
            <Button nativeButton={false} render={<Link href="/checkout" />}>Checkout</Button>
          </div>
        </div>
      )}
    </main>
  );
}
