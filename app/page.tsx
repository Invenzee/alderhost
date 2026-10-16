"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/chip";
import { MarkIcon } from "@/components/mark-icon";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { pkr, usd } from "@/lib/format";

type Result = {
  domain: string;
  status: "available" | "unavailable" | "premium" | "invalid";
  purchasable: boolean;
  premium: boolean;
  duration: number;
  sellYear1: number | null;
  sellExtraYear: number | null;
  sellBundle?: number | null;
};

type SearchResponse = { query: string; fx: number; results: Result[] };
type Pricing = {
  fx: number;
  tlds: { tld: string; sellRegistration: number | null; sellRenew: number | null; sellTransfer: number | null }[];
};

const steps: { title: string; copy: string; icon: "search" | "cart" | "card" | "sliders" }[] = [
  { title: "Search a name", copy: "Check .com, .net, .org, .io, .co, .store, .online, and .xyz at once.", icon: "search" },
  { title: "Add to cart", copy: "Choose 1 to 10 years. The final price is confirmed at checkout.", icon: "cart" },
  { title: "Pay", copy: "Registration, renewal, and transfer happen only after an order is marked paid.", icon: "card" },
  { title: "Manage", copy: "Edit DNS, forwarding, nameservers, contacts, lock, and privacy.", icon: "sliders" },
];

const features: { title: string; copy: string; icon: "dns" | "ns" | "mail" | "forward" | "shield" }[] = [
  { title: "DNS records", copy: "A, AAAA, CNAME, MX, TXT, SRV, CAA", icon: "dns" },
  { title: "Nameservers", copy: "2 to 13, only if you want to change them", icon: "ns" },
  { title: "Email forwarding", copy: "Up to 5 destinations per mailbox", icon: "mail" },
  { title: "URL forwarding", copy: "301, 302, or Cloaked", icon: "forward" },
  { title: "Contacts, lock, privacy", copy: "Update the registrant, lock or unlock, turn privacy on or off", icon: "shield" },
];

export default function HomePage() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [whoisDomain, setWhoisDomain] = useState("");
  const { add, items } = useCart();

  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(draft.trim()), 500);
    return () => window.clearTimeout(handle);
  }, [draft]);

  const search = useQuery({
    queryKey: ["search", query],
    enabled: query.length > 1,
    queryFn: () => api<SearchResponse>(`/domains/search?q=${encodeURIComponent(query)}`),
  });

  const pricing = useQuery({ queryKey: ["pricing"], queryFn: () => api<Pricing>("/pricing") });

  const whois = useQuery({
    queryKey: ["whois", whoisDomain],
    enabled: Boolean(whoisDomain),
    queryFn: () => api<{ domain: string; whois: Record<string, unknown> }>(`/domains/whois?domain=${encodeURIComponent(whoisDomain)}`),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setQuery(draft.trim());
  }

  const searching = query.length > 1;

  return (
    <main className="page bleed">
      <section className="ls l1">
        <div className="in">
          <div className="hero-grid">
            <div className="hero">
              <h1>Find a name for what you are building.</h1>
              <p className="lead" style={{ maxWidth: "36ch" }}>
                Search a name. The price shows in USD and PKR.
              </p>
              <form onSubmit={onSubmit} className="fl sb" id="search">
                <div className="grow">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="yourbrand or yourbrand.com"
                    aria-label="Search"
                  />
                </div>
                <Button type="submit">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="7" cy="7" r="5" />
                    <path d="m11 11 4 4" />
                  </svg>
                  Search
                </Button>
              </form>
            </div>
            <img className="hero-art" src="/hero.jpg" alt="An alder leaf, a globe, and a card showing yourname.com is available" />
          </div>
        </div>
      </section>

      {searching ? (
        <section className="ls">
          <div className="in">
            <h2 className="title" style={{ marginBottom: 16 }}>Results for {query}</h2>
            {search.isFetching ? <p className="lead sm"><span className="sp" style={{ verticalAlign: "-2px" }} /> Checking availability…</p> : null}
            {search.error ? <p className="er">{search.error.message}</p> : null}
            <div className="card results" style={{ padding: "4px 18px" }}>
              {search.data?.results.map((result) => {
                const inCart = items.some((item) => item.domain === result.domain);
                const price = result.sellYear1;
                const rate = search.data?.fx || 0;
                return (
                  <div className="rw" key={result.domain}>
                    <span className="dn">{result.domain}</span>
                    <span>
                      <Status status={result.status} />
                      {inCart && result.purchasable ? <span className="pk">Already in cart</span> : null}
                    </span>
                    <span>
                      {result.purchasable && price != null ? (
                        <>
                          <span className="big">{usd(price)}</span>
                          <span className="pk">and {pkr(price * rate)} first year</span>
                        </>
                      ) : null}
                      {result.status === "available" && !result.purchasable ? (
                        <>
                          <span className="lead">Pricing is still loading.</span>
                          <div className="skel" style={{ width: "60%", marginTop: 6 }} />
                        </>
                      ) : null}
                      {result.status === "unavailable" || result.status === "invalid" ? <span className="lead">No price</span> : null}
                    </span>
                    <span>
                      {result.status === "unavailable" ? (
                        <Button variant="outline" onClick={() => setWhoisDomain(result.domain)}>WHOIS</Button>
                      ) : null}
                      {result.purchasable && price != null ? (
                        <Button
                          disabled={inCart}
                          onClick={() =>
                            add({
                              domain: result.domain,
                              years: 1,
                              premium: result.premium,
                              duration: result.duration || 1,
                              sellBundle: result.sellBundle || price,
                              sellYear1: price,
                              sellExtraYear: result.sellExtraYear || 0,
                            })
                          }
                        >
                          {inCart ? "In cart" : "Add to cart"}
                        </Button>
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>
            {whoisDomain ? (
              <div className="card" style={{ marginTop: 12 }}>
                <h3>WHOIS for {whoisDomain}</h3>
                {whois.isFetching ? <p className="lead sm">Looking up the record…</p> : null}
                {whois.error ? <p className="er">{whois.error.message}</p> : null}
                {whois.data ? <pre>{formatWhois(whois.data.whois)}</pre> : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="ls l3">
        <div className="in">
          <h2 className="title">Eight extensions, priced in USD and PKR.</h2>
          <p className="lead">WHOIS privacy is included.{pricing.data ? ` PKR uses ${pricing.data.fx} per USD.` : ""}</p>
          <div className="tg">
            {pricing.data?.tlds.map((row) => (
              <Link key={row.tld} href="/pricing" className="tc">
                <b className="dn">.{row.tld}</b>
                <span className="big">{usd(row.sellRegistration)}</span>
                <span className="pk">{row.sellRegistration != null ? `${pkr(row.sellRegistration * (pricing.data?.fx || 0))} first year` : "—"}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="ls">
        <div className="in">
          <h2 className="title">From search to managed domain in four steps.</h2>
          <ol className="hw">
            {steps.map((step) => (
              <li key={step.title}>
                <span className="ic"><MarkIcon name={step.icon} /></span>
                <b>{step.title}</b>
                <span className="lead">{step.copy}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ls l5">
        <div className="in cols">
          <div>
            <h2 className="title">One place for everything after you register.</h2>
            <p className="lead">Renew, DNS, forwarding, and contacts live on each domain.</p>
            <ul className="fe">
              {features.map((item) => (
                <li key={item.title}>
                  <span className="ic"><MarkIcon name={item.icon} /></span>
                  <span><b>{item.title}</b> <span className="lead">{item.copy}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <img className="shot" src="/manage.jpg" alt="Lock, privacy, and DNS tools for a domain" />
        </div>
      </section>

      <section className="ls l6">
        <div className="in">
          <div className="transfer-row">
            <img src="/transfer.jpg" alt="" />
            <div>
              <h2 className="title" style={{ color: "#fff" }}>Already own a domain?</h2>
              <p className="lead">Unlock it at the current registrar and bring the authorization code.</p>
            </div>
            <Link className="btn" href="/transfer">Transfer in</Link>
          </div>
        </div>
      </section>

      <section className="ls">
        <div className="in">
          <h2 className="title">Included with every name.</h2>
          <div className="quad">
            {[
              ["/vec-privacy.jpg", "WHOIS privacy", "Included with the registration."],
              ["/vec-dns.jpg", "DNS you can edit", "Records live on the domain."],
              ["/vec-mail.jpg", "Email forwarding", "Up to five destinations."],
              ["/vec-lock.jpg", "Lock and auth code", "The code is emailed, never shown here."],
            ].map(([src, title, copy]) => (
              <article className="media" key={title}>
                <img src={src} alt="" />
                <h3>{title}</h3>
                <p className="lead" style={{ margin: 0 }}>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ls l3">
        <div className="in">
          <h2 className="title">A name for the work you do.</h2>
          <div className="trio">
            {[
              ["/vec-shop.jpg", "A shop", ".store and .com"],
              ["/vec-studio.jpg", "A studio", ".co and .xyz"],
              ["/vec-app.jpg", "A product", ".io"],
            ].map(([src, title, copy]) => (
              <article className="media" key={title}>
                <img src={src} alt="" />
                <h3>{title}</h3>
                <p className="lead" style={{ margin: 0 }}>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ls">
        <div className="in">
          <h2 className="title">Nothing moves until you pay.</h2>
          <div className="trio">
            {[
              ["/vec-search.jpg", "Search first", "See the price before it is in the cart."],
              ["/vec-receipt.jpg", "Then a receipt", "The PKR rate locks on the order."],
              ["/vec-help.jpg", "Then the name is yours", "NameSilo emails the registrant to verify the contact."],
            ].map(([src, title, copy]) => (
              <article className="media" key={title}>
                <img src={src} alt="" />
                <h3>{title}</h3>
                <p className="lead" style={{ margin: 0 }}>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ls l7">
        <div className="in">
          <h2 className="title">Your next domain is one search away.</h2>
          <div className="fl" style={{ justifyContent: "center", marginTop: 18 }}>
            <Link className="btn" href="/#search">Search domains</Link>
            <Link className="btn o" href="/pricing">See pricing</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Status({ status }: { status: Result["status"] }) {
  if (status === "premium") return <Chip tone="pr">Premium</Chip>;
  if (status === "unavailable") return <Chip tone="mu">Taken</Chip>;
  if (status === "invalid") return <Chip tone="mu">Invalid</Chip>;
  return <Chip tone="ok">Available</Chip>;
}

function formatWhois(data: Record<string, unknown>) {
  return Object.entries(data)
    .map(([key, value]) => {
      const text = typeof value === "string" || typeof value === "number" ? String(value) : JSON.stringify(value);
      return `${key}: ${text}`;
    })
    .join("\n");
}
