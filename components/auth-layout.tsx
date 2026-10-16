import type { ReactNode } from "react";

const defaultPoints = [
  ["/sign-key.jpg", "One sign-in", "Domains, orders, and DNS open after you sign in."],
  ["/sign-domains.jpg", "Your names stay put", "Renewals and contacts live on each domain."],
  ["/sign-shield.jpg", "Privacy stays on", "WHOIS privacy is included. Auto-renew stays off."],
];

export function AuthLayout({
  title,
  lead,
  hero = "/sign-hero.jpg",
  points = defaultPoints,
  tall = false,
  children,
}: {
  title: string;
  lead: string;
  hero?: string;
  points?: string[][];
  tall?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="page">
      <div className={tall ? "auth tall" : "auth"}>
        <aside className="auth-panel">
          <img className="auth-hero" src={hero} alt="" />
        </aside>
        <div className="auth-form">
          <h1 className="title">{title}</h1>
          <p className="lead">{lead}</p>
          {children}
        </div>
      </div>
      <div className="auth-points">
        {points.map(([src, heading, copy]) => (
          <article key={heading}>
            <img src={src} alt="" />
            <div>
              <h2>{heading}</h2>
              <p className="lead sm">{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
