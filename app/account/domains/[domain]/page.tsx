"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ContactFields, ContactInput, emptyContact } from "@/components/contact-fields";

type View = {
  domain: {
    name: string;
    expires: string;
    locked: boolean;
    privacy: boolean;
    nameservers: string[];
    forwardUrl: string;
    forwardType: string;
    warning: string;
  };
  contact: ContactInput | null;
  emailVerificationRequired: string;
};

type DnsRecord = { id: string; type: string; host: string; value: string; ttl: number; distance: number };
type EmailForward = { email: string; forwardsTo: string[] };

const tabs = ["overview", "dns", "nameservers", "email", "forwarding", "contacts", "settings"] as const;

export default function DomainManagePage() {
  const params = useParams<{ domain: string }>();
  const domain = decodeURIComponent(params.domain);
  const [tab, setTab] = useState<(typeof tabs)[number]>("overview");
  const view = useQuery({
    queryKey: ["domain", domain],
    queryFn: () => api<View>(`/domains/${encodeURIComponent(domain)}`),
  });

  return (
    <main className="page">
      <h1 className="title">{domain}</h1>
      {view.data?.domain.expires ? <p className="lead">Expires {view.data.domain.expires}</p> : null}
      {view.isFetching && !view.data ? <p className="lead sm"><span className="sp" /> Loading…</p> : null}
      {view.data?.emailVerificationRequired === "Yes" ? (
        <div className="bn" style={{ marginTop: 12 }}>NameSilo still needs the registrant to verify their email.</div>
      ) : null}
      {view.error ? <p className="er">{view.error.message}</p> : null}
      <div className="tabs">
        {tabs.map((item) => (
          <button key={item} className={tab === item ? "on" : ""} onClick={() => setTab(item)} type="button">
            {item}
          </button>
        ))}
      </div>
      {tab === "overview" && view.data ? <RenewPanel domain={domain} contact={view.data.contact} /> : null}
      {tab === "dns" ? <DnsPanel domain={domain} /> : null}
      {tab === "nameservers" && view.data ? <NameserverPanel domain={domain} current={view.data.domain.nameservers} /> : null}
      {tab === "email" ? <EmailPanel domain={domain} /> : null}
      {tab === "forwarding" && view.data ? <ForwardPanel domain={domain} current={view.data.domain.forwardUrl} /> : null}
      {tab === "contacts" && view.data ? <ContactPanel domain={domain} current={view.data.contact} /> : null}
      {tab === "settings" && view.data ? <SettingsPanel domain={domain} locked={view.data.domain.locked} privacy={view.data.domain.privacy} /> : null}
    </main>
  );
}

function YearSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {Array.from({ length: 10 }, (_, index) => index + 1).map((year) => (
        <option key={year} value={year}>{year} year{year > 1 ? "s" : ""}</option>
      ))}
    </select>
  );
}

function RenewPanel({ domain, contact }: { domain: string; contact: ContactInput | null }) {
  const router = useRouter();
  const [years, setYears] = useState(1);
  const [form, setForm] = useState<ContactInput>(contact || emptyContact);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await api<{ order: { id: string } }>(`/domains/${encodeURIComponent(domain)}/renew`, {
        method: "POST",
        body: { years, contact: form },
      });
      router.push(`/orders/${result.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Renewal failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card stack">
      <p className="lead" style={{ marginTop: 0 }}>Renewal creates an order. It runs after the order is marked paid. Auto-renew stays off.</p>
      <div style={{ maxWidth: 200 }}>
        <label>
          Years
          <YearSelect value={years} onChange={setYears} />
        </label>
      </div>
      <ContactFields value={form} onChange={setForm} />
      {error ? <p className="er">{error}</p> : null}
      <div><Button type="submit">Create renewal order</Button></div>
    </form>
  );
}

function DnsPanel({ domain }: { domain: string }) {
  const queryClient = useQueryClient();
  const records = useQuery({
    queryKey: ["dns", domain],
    queryFn: () => api<{ records: DnsRecord[] }>(`/domains/${encodeURIComponent(domain)}/dns`),
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "A", host: "", value: "", ttl: "3600", distance: "0" });
  const [error, setError] = useState("");

  async function add(event: FormEvent) {
    event.preventDefault();
    setError("");
    const body = { ...form, ttl: Number(form.ttl), distance: Number(form.distance) };
    try {
      if (editing) {
        await api(`/domains/${encodeURIComponent(domain)}/dns/${editing}`, { method: "PATCH", body });
      } else {
        await api(`/domains/${encodeURIComponent(domain)}/dns`, { method: "POST", body });
      }
      await queryClient.invalidateQueries({ queryKey: ["dns", domain] });
      setEditing(null);
      setForm({ type: "A", host: "", value: "", ttl: "3600", distance: "0" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the record");
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await api(`/domains/${encodeURIComponent(domain)}/dns/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["dns", domain] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the record");
    }
  }

  return (
    <div className="card">
      <form onSubmit={add} className="fl">
        <div style={{ flex: "0 0 110px" }}>
          <label>
            Type
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              {["A", "AAAA", "CNAME", "MX", "TXT", "SRV", "CAA"].map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
        </div>
        <label>
          Host
          <input placeholder="@" value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} />
        </label>
        <label>
          Value
          <input value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
        </label>
        <div style={{ flex: "0 0 100px" }}>
          <label>
            TTL
            <input value={form.ttl} onChange={(event) => setForm({ ...form, ttl: event.target.value })} />
          </label>
        </div>
        <Button type="submit">{editing ? "Update" : "Add"}</Button>
      </form>
      {error ? <p className="er">{error}</p> : null}
      {records.data?.records.map((record) => (
        <div className="rw dns" key={record.id}>
          <span className="chip c-w">{record.type}</span>
          <span className="mono">{record.host}</span>
          <span className="mono break">→ {record.value}</span>
          <span className="acts">
            <Button variant="ghost" onClick={() => { setEditing(record.id); setForm({ type: record.type, host: record.host, value: record.value, ttl: String(record.ttl), distance: String(record.distance) }); }}>Edit</Button>
            <Button variant="ghost" onClick={() => remove(record.id)}>Delete</Button>
          </span>
        </div>
      ))}
    </div>
  );
}

function NameserverPanel({ domain, current }: { domain: string; current: string[] }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(current.join("\n"));
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(current.join("\n"));
  }, [current]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/domains/${encodeURIComponent(domain)}/nameservers`, {
        method: "PUT",
        body: { nameservers: value.split("\n").map((line) => line.trim()).filter(Boolean) },
      });
      await queryClient.invalidateQueries({ queryKey: ["domain", domain] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update nameservers");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card stack">
      <p className="lead" style={{ marginTop: 0 }}>New domains use NameSilo DNS. Enter 2 to 13 nameservers, one per line, only if you want to change them.</p>
      <textarea value={value} onChange={(event) => setValue(event.target.value)} />
      {error ? <p className="er">{error}</p> : null}
      <div><Button type="submit">Save nameservers</Button></div>
    </form>
  );
}

function EmailPanel({ domain }: { domain: string }) {
  const queryClient = useQueryClient();
  const forwards = useQuery({
    queryKey: ["email", domain],
    queryFn: () => api<{ forwards: EmailForward[] }>(`/domains/${encodeURIComponent(domain)}/email-forwards`),
  });
  const [email, setEmail] = useState("");
  const [destinations, setDestinations] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/domains/${encodeURIComponent(domain)}/email-forwards`, {
        method: "POST",
        body: { email, forwards: destinations.split(",").map((item) => item.trim()).filter(Boolean) },
      });
      await queryClient.invalidateQueries({ queryKey: ["email", domain] });
      setEmail("");
      setDestinations("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save forwarding");
    }
  }

  async function remove(mailbox: string) {
    await api(`/domains/${encodeURIComponent(domain)}/email-forwards?email=${encodeURIComponent(mailbox)}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["email", domain] });
  }

  return (
    <div className="card">
      <form onSubmit={onSubmit} className="fl">
        <label>
          Mailbox
          <input placeholder="Mailbox, such as hello" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Destinations
          <input placeholder="Up to 5 destinations, comma separated" value={destinations} onChange={(event) => setDestinations(event.target.value)} />
        </label>
        <Button type="submit">Save forward</Button>
      </form>
      {error ? <p className="er">{error}</p> : null}
      {forwards.data?.forwards.map((row) => (
        <div className="rw pair" key={row.email}>
          <span className="mono">{row.email} → {row.forwardsTo.join(", ")}</span>
          <Button variant="ghost" onClick={() => remove(row.email)}>Delete</Button>
        </div>
      ))}
    </div>
  );
}

function ForwardPanel({ domain, current }: { domain: string; current: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ protocol: "https", address: "", method: "301", subDomain: "" });
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/domains/${encodeURIComponent(domain)}/forward`, { method: "PUT", body: form });
      await queryClient.invalidateQueries({ queryKey: ["domain", domain] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save forwarding");
    }
  }

  async function removeSubdomain() {
    setError("");
    try {
      await api(`/domains/${encodeURIComponent(domain)}/forward?subDomain=${encodeURIComponent(form.subDomain)}`, { method: "DELETE" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the subdomain forward");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card stack">
      {current ? <p className="lead" style={{ marginTop: 0 }}>Current apex forward: {current}</p> : null}
      <div className="fl">
        <label>
          Protocol
          <select value={form.protocol} onChange={(event) => setForm({ ...form, protocol: event.target.value })}>
            <option value="https">https</option>
            <option value="http">http</option>
          </select>
        </label>
        <label>
          Method
          <select value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
            <option value="301">301</option>
            <option value="302">302</option>
            <option value="cloaked">Cloaked</option>
          </select>
        </label>
        <label>
          Destination host
          <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        </label>
        <label>
          Subdomain
          <input placeholder="Subdomain, blank for apex" value={form.subDomain} onChange={(event) => setForm({ ...form, subDomain: event.target.value })} />
        </label>
      </div>
      {error ? <p className="er">{error}</p> : null}
      <div className="fl" style={{ justifyContent: "flex-start" }}>
        <Button className="tight" type="submit">Save forward</Button>
        <Button className="tight" type="button" variant="destructive" onClick={removeSubdomain}>Delete subdomain forward</Button>
      </div>
    </form>
  );
}

function ContactPanel({ domain, current }: { domain: string; current: ContactInput | null }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ContactInput>(current || emptyContact);
  const [error, setError] = useState("");

  useEffect(() => {
    if (current) setForm(current);
  }, [current]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/domains/${encodeURIComponent(domain)}/contacts`, { method: "PUT", body: form });
      await queryClient.invalidateQueries({ queryKey: ["domain", domain] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update contacts");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card stack">
      <ContactFields value={form} onChange={setForm} />
      {error ? <p className="er">{error}</p> : null}
      <div><Button type="submit">Save contacts</Button></div>
    </form>
  );
}

function SettingsPanel({ domain, locked, privacy }: { domain: string; locked: boolean; privacy: boolean }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function update(path: string, body: unknown) {
    setError("");
    setMessage("");
    try {
      const result = await api<{ message?: string }>(`/domains/${encodeURIComponent(domain)}/${path}`, { method: "POST", body });
      setMessage(result.message || "Saved");
      await queryClient.invalidateQueries({ queryKey: ["domain", domain] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div className="card">
      <div className="fl" style={{ justifyContent: "flex-start" }}>
        <Button className="tight" variant="outline" onClick={() => update("lock", { locked: !locked })}>{locked ? "Unlock" : "Lock"}</Button>
        <Button className="tight" variant="outline" onClick={() => update("privacy", { enabled: !privacy })}>{privacy ? "Turn privacy off" : "Turn privacy on"}</Button>
        <Button className="tight" variant="outline" onClick={() => update("auth-code", {})}>Email auth code</Button>
      </div>
      <p className="lead sm">The authorization code is emailed by NameSilo. It is never shown here.</p>
      {message ? <p className="ok">{message}</p> : null}
      {error ? <p className="er">{error}</p> : null}
    </div>
  );
}
