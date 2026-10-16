export function MarkIcon({ name }: { name: "search" | "cart" | "card" | "sliders" | "dns" | "ns" | "mail" | "forward" | "shield" | "leaf" | "rupee" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "search") {
    return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
  }
  if (name === "cart") {
    return <svg {...common}><path d="M4 6h16l-1.4 8.2a2 2 0 0 1-2 1.6H8.2a2 2 0 0 1-2-1.5L4 6Z" /><path d="M8 6 9.2 3h5.6L16 6" /><circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" /><circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" /></svg>;
  }
  if (name === "card") {
    return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>;
  }
  if (name === "sliders") {
    return <svg {...common}><path d="M4 8h16M4 16h16" /><circle cx="9" cy="8" r="2" fill="#fff" /><circle cx="15" cy="16" r="2" fill="#fff" /></svg>;
  }
  if (name === "dns") {
    return <svg {...common}><circle cx="6" cy="12" r="2" /><circle cx="12" cy="7" r="2" /><circle cx="18" cy="12" r="2" /><path d="M8 12h8M12 9v5" /></svg>;
  }
  if (name === "ns") {
    return <svg {...common}><rect x="4" y="4" width="16" height="6" rx="1.5" /><rect x="4" y="14" width="16" height="6" rx="1.5" /><path d="M8 7h.01M8 17h.01" /></svg>;
  }
  if (name === "mail") {
    return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
  }
  if (name === "forward") {
    return <svg {...common}><path d="M4 12h12" /><path d="m12 7 5 5-5 5" /><path d="M18 8v8" /></svg>;
  }
  if (name === "shield") {
    return <svg {...common}><path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  }
  if (name === "rupee") {
    return <svg {...common}><path d="M7 6h10M7 10h10" /><path d="M8 6c4 0 6 1.2 6 4s-2 4-6 4H7l8 6" /></svg>;
  }
  return <svg {...common}><path d="M12 21c4-2 7-6 7-10V6l-7-3-7 3v5c0 4 3 8 7 10Z" /><path d="M12 8v8M9 11c2-2 4-2 6 0" /></svg>;
}
