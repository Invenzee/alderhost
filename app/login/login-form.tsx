"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth-layout";
import { api } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const next = params.get("next") || "/account/domains";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await api("/auth/login", { method: "POST", body: { email, password } });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout title="Sign in" lead="Use the email on your Alderhost account.">
      <form onSubmit={onSubmit} className="card stack">
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="er">{error}</p> : null}
        <div className="fl" style={{ justifyContent: "flex-start" }}>
          <Button className="tight" type="submit" disabled={pending}>
            {pending ? <><span className="sp" /> Signing in…</> : "Sign in"}
          </Button>
        </div>
      </form>
      <p className="lead">
        New here? <Link className="accent" href={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link>
      </p>
    </AuthLayout>
  );
}
