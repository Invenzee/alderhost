"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth-layout";
import { ContactFields, ContactInput, emptyContact } from "@/components/contact-fields";

const points = [
  ["/transfer-unlock.jpg", "Unlock it first", "Turn off the lock at the registrar that has the name now."],
  ["/transfer-code.jpg", "Copy the code", "The EPP or authorization code is what starts the move."],
  ["/transfer-mail.jpg", "Watch the admin email", "The confirmation message goes to that address."],
];

export default function TransferPage() {
  const router = useRouter();
  const session = useSession();
  const [domain, setDomain] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [contact, setContact] = useState<ContactInput>(emptyContact);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await api<{ order: { id: string } }>("/transfers", {
        method: "POST",
        body: { domain, auth: authCode, couponCode, contact },
      });
      router.push(`/orders/${result.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer could not be started");
    } finally {
      setPending(false);
    }
  }

  if (!session.isLoading && !session.data?.user) {
    return (
      <AuthLayout
        title="Transfer a domain"
        lead="Sign in to start a transfer. Unlock the name at the current registrar and copy the authorization code."
        hero="/transfer-hero.jpg"
        points={points}
      >
        <div className="card">
          <Button nativeButton={false} render={<Link href="/login?next=/transfer" />}>Sign in</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Transfer in"
      lead="The move starts after this order is marked paid."
      hero="/transfer-hero.jpg"
      points={points}
      tall
    >
      <form onSubmit={onSubmit} className="card stack">
        <div className="g2">
          <label>
            Domain
            <input placeholder="example.com" value={domain} onChange={(event) => setDomain(event.target.value)} />
          </label>
          <label>
            Authorization code
            <input value={authCode} onChange={(event) => setAuthCode(event.target.value)} />
          </label>
          <label>
            Coupon
            <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} />
          </label>
        </div>
        <h2 style={{ fontSize: 18 }}>Registrant contact</h2>
        <ContactFields value={contact} onChange={setContact} />
        {error ? <p className="er">{error}</p> : null}
        <div className="fl" style={{ justifyContent: "flex-start" }}>
          <Button className="tight" type="submit" disabled={pending}>
            {pending ? <><span className="sp" /> Creating order…</> : "Create transfer order"}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
