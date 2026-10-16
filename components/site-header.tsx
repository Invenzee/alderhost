"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/auth";
import { api } from "@/lib/api";
import { LogoMark } from "@/components/logo-mark";

const links = [
  { href: "/pricing", label: "Pricing" },
  { href: "/transfer", label: "Transfer" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { items } = useCart();
  const session = useSession();
  const queryClient = useQueryClient();
  const user = session.data?.user;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <header className={open ? "hd menu-open" : "hd"}>
      <div className="shell bar">
      <Link href="/" className="logo">
        <LogoMark />
        Alderhost
      </Link>
      <button type="button" className="btn g mn" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        Menu
      </button>
      <nav>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={pathname === link.href ? "on" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="rt">
        <Link href="/cart">
          Cart
          {items.length > 0 ? <span className="bd">{items.length}</span> : null}
        </Link>
        {user ? (
          <>
            <Link className="x" href="/account/domains">Domains</Link>
            {user.role === "admin" ? <Link className="x" href="/admin">Admin</Link> : null}
            <button type="button" className="x" onClick={logout}>Sign out</button>
          </>
        ) : (
          <Link href="/login">Sign in</Link>
        )}
      </div>
      </div>
    </header>
  );
}
