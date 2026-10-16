"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Chip } from "@/components/chip";
import { api } from "@/lib/api";

type DomainRow = { name: string; expires: string; locked: boolean; privacy: boolean; status: string };

export default function DomainsPage() {
  const domains = useQuery({ queryKey: ["domains"], queryFn: () => api<{ domains: DomainRow[] }>("/domains") });

  return (
    <main className="page">
      <div className="top">
        <h1 className="title">My domains</h1>
        <Link href="/account/orders" className="btn o">Orders</Link>
      </div>
      <p className="lead">Renew, DNS, forwarding, and contacts live on each domain.</p>
      {domains.isFetching && !domains.data ? <p className="lead sm"><span className="sp" /> Loading…</p> : null}
      {domains.error ? <p className="er">{domains.error.message}</p> : null}
      <div className="cols" style={{ marginTop: 18 }}>
        {domains.data?.domains.map((domain) => (
          <Link key={domain.name} href={`/account/domains/${domain.name}`} className="card">
            <div className="dn">{domain.name}</div>
            <p className="lead" style={{ margin: "4px 0 10px" }}>{domain.expires || "Expiry pending"}</p>
            <span className="acts">
              <Chip tone={domain.locked ? "ok" : "mu"}>{domain.locked ? "Locked" : "Unlocked"}</Chip>
              <Chip tone={domain.privacy ? "ok" : "mu"}>{domain.privacy ? "Privacy on" : "Privacy off"}</Chip>
            </span>
          </Link>
        ))}
      </div>
      {domains.data?.domains.length === 0 ? <div className="card lead" style={{ marginTop: 18 }}>Domains appear here after registration finishes.</div> : null}
    </main>
  );
}
