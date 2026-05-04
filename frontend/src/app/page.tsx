"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Listing, ListingFilters } from "@/lib/types";
import { api } from "@/lib/api";
import MapFilters from "@/components/Map/MapFilters";
import ListingModal from "@/components/Listings/ListingModal";
import { Loader2, AlertCircle } from "lucide-react";

const MapView = dynamic(() => import("@/components/Map/MapView"), { ssr: false });

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<ListingFilters>({});
  const [selected, setSelected] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total_active: number; avg_rent: number; by_borough: Record<string, number> } | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | undefined> = {
        min_price: filters.min_price,
        max_price: filters.max_price,
        min_bedrooms: filters.min_bedrooms,
        max_bedrooms: filters.max_bedrooms,
        boroughs: filters.boroughs?.join(","),
        limit: 200,
      };
      const data = await api.listings.list(params);
      setListings(data);
    } catch (e) {
      setError("Could not load listings. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { api.listings.stats().then(setStats).catch(() => {}); }, []);

  return (
    <div className="flex h-full">
      <MapFilters filters={filters} onChange={setFilters} resultCount={listings.length} />

      <div className="flex-1 relative">
        {/* Stats bar */}
        {stats && (
          <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm text-xs flex gap-4 items-center">
              <span className="font-semibold text-slate-700">{stats.total_active} active listings</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">Avg rent: <strong>${stats.avg_rent.toLocaleString()}/mo</strong></span>
              {Object.entries(stats.by_borough).map(([b, c]) => (
                <span key={b} className="text-slate-500 hidden lg:inline">{b}: {c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 size={20} className="animate-spin" />
              Loading listings...
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="absolute top-16 left-4 right-4 z-20 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <MapView listings={listings} onListingClick={setSelected} />
      </div>

      {selected && (
        <ListingModal listing={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
