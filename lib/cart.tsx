"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartItem } from "@/lib/format";

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (domain: string) => void;
  setYears: (domain: string, years: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "alderhost-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        setItems([]);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      add: (item) =>
        setItems((current) => {
          const next = current.filter((entry) => entry.domain !== item.domain);
          return [...next, item];
        }),
      remove: (domain) => setItems((current) => current.filter((entry) => entry.domain !== domain)),
      setYears: (domain, years) =>
        setItems((current) => current.map((entry) => (entry.domain === domain ? { ...entry, years } : entry))),
      clear: () => setItems([]),
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("Cart is unavailable");
  return context;
}
