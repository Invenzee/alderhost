"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usd } from "@/lib/format";

type Pricing = {
  fx: number;
  tlds: { tld: string; sellRegistration: number | null; sellRenew: number | null; sellTransfer: number | null }[];
};

export default function PricingPage() {
  const pricing = useQuery({ queryKey: ["pricing"], queryFn: () => api<Pricing>("/pricing") });
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const needle = query.trim().replace(/^\./, "").toLowerCase();
    const list = pricing.data?.tlds ?? [];
    if (!needle) return list;
    return list.filter((row) => row.tld.toLowerCase().includes(needle));
  }, [pricing.data, query]);

  return (
    <main className="page">
      <div className="price-top">
        <div>
          <h1 className="title">Pricing</h1>
          <p className="lead">
            Prices are in USD. Register is the first year. Renew and transfer are one year. WHOIS privacy is included.
          </p>
        </div>
        <input
          aria-label="Find an extension"
          placeholder="Find an extension"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="price-sheet">
        <table className="price-table">
          <thead>
            <tr>
              <th>Extension</th>
              <th>Register</th>
              <th>Renew</th>
              <th>Transfer</th>
            </tr>
          </thead>
          <tbody>
            {pricing.isFetching && !pricing.data ? (
              <tr>
                <td colSpan={4} className="price-note">Loading prices…</td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.tld}>
                <th scope="row">.{row.tld}</th>
                <td>{usd(row.sellRegistration)}</td>
                <td>{usd(row.sellRenew)}</td>
                <td>{usd(row.sellTransfer)}</td>
              </tr>
            ))}
            {pricing.data && rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="price-note">No extension matches that.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {pricing.error ? <p className="er">{pricing.error.message}</p> : null}
    </main>
  );
}
