import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

export function SiteFooter() {
  return (
    <footer className="ft">
      <div className="shell foot">
        <div>
          <Link href="/" className="logo foot-logo">
            <LogoMark />
            Alderhost
          </Link>
          <p className="lead">Search, register, and manage domains. WHOIS privacy is included. Prices show in USD and PKR.</p>
        </div>
        <div>
          <h2>Product</h2>
          <Link href="/#search">Search</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/transfer">Transfer</Link>
          <Link href="/cart">Cart</Link>
        </div>
        <div>
          <h2>Account</h2>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create account</Link>
          <Link href="/account/domains">Domains</Link>
          <Link href="/account/orders">Orders</Link>
        </div>
        <div>
          <h2>Every registration</h2>
          <p>WHOIS privacy included</p>
          <p>Auto-renew is off</p>
          <p>The PKR rate locks at checkout</p>
        </div>
      </div>
      <div className="shell foot-base">Alderhost · Domain search, registration, and management</div>
    </footer>
  );
}
