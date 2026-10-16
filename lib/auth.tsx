"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type SessionUser = { id: string; email: string; role: "customer" | "admin" };

export function useSession() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: SessionUser | null }>("/auth/me"),
  });
}
