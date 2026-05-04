import { Listing, Alert, AlertCreate, Neighborhood, NeighborhoodScore, Stats } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET;

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(API_SECRET ? { "X-API-Secret": API_SECRET } : {}),
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text);
  }
  return res.json();
}

export const api = {
  listings: {
    list(params: Record<string, string | number | undefined> = {}): Promise<Listing[]> {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
      });
      return req(`/listings?${qs}`);
    },
    get(id: string): Promise<Listing> {
      return req(`/listings/${id}`);
    },
    stats(): Promise<Stats> {
      return req("/listings/stats");
    },
  },

  alerts: {
    list(email?: string): Promise<Alert[]> {
      const qs = email ? `?email=${encodeURIComponent(email)}` : "";
      return req(`/alerts${qs}`);
    },
    create(body: AlertCreate): Promise<Alert> {
      return req("/alerts", { method: "POST", body: JSON.stringify(body) });
    },
    toggle(id: string, is_active: boolean): Promise<Alert> {
      return req(`/alerts/${id}`, { method: "PATCH", body: JSON.stringify({ is_active }) });
    },
    delete(id: string): Promise<void> {
      return req(`/alerts/${id}`, { method: "DELETE" });
    },
  },

  chat: {
    send(messages: Array<{ role: string; content: string }>, max_price?: number, borough?: string): Promise<{ reply: string }> {
      return req("/chat", {
        method: "POST",
        body: JSON.stringify({ messages, max_price, borough }),
      });
    },
  },

  neighborhoods: {
    list(): Promise<Neighborhood[]> {
      return req("/neighborhoods");
    },
    recommend(body: {
      work_address: string;
      max_commute_minutes: number;
      max_budget?: number;
      bedrooms?: number;
      preferred_transit: string;
      vibe_preferences: string[];
    }): Promise<NeighborhoodScore[]> {
      return req("/neighborhoods/recommend", { method: "POST", body: JSON.stringify(body) });
    },
  },
};
