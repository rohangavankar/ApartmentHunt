"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { NeighborhoodScore } from "@/lib/types";
import { MapPin, Train, Clock, DollarSign, Loader2, Building2, Star } from "lucide-react";
import clsx from "clsx";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function useAddressAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ place_name: string }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback((val: string) => {
    setQuery(val);
    clearTimeout(timer.current);
    if (!val || val.length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(val);
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json` +
          `?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=us` +
          `&bbox=-74.26,40.48,-73.70,40.93&limit=5`
        );
        const data = await res.json();
        setSuggestions(data.features ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, []);

  const clear = () => setSuggestions([]);

  return { query, setQuery, suggestions, search, clear };
}

const VIBE_OPTIONS = [
  { label: "Trendy", value: "trendy" },
  { label: "Nightlife", value: "nightlife" },
  { label: "Family-friendly", value: "family-friendly" },
  { label: "Quiet", value: "quiet" },
  { label: "Parks", value: "parks" },
  { label: "Restaurants", value: "restaurants" },
  { label: "Upscale", value: "upscale" },
  { label: "Affordable", value: "affordable" },
  { label: "Cultural", value: "cultural" },
  { label: "Art", value: "art" },
];

export default function NeighborhoodFinder() {
  const [form, setForm] = useState({
    work_address: "",
    max_commute_minutes: 45,
    max_budget: "",
    bedrooms: "",
    preferred_transit: "subway",
    vibe_preferences: [] as string[],
  });
  const [results, setResults] = useState<NeighborhoodScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const addr = useAddressAutocomplete();

  const toggleVibe = (v: string) => {
    setForm((f) => ({
      ...f,
      vibe_preferences: f.vibe_preferences.includes(v)
        ? f.vibe_preferences.filter((x) => x !== v)
        : [...f.vibe_preferences, v],
    }));
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.work_address) return;
    setLoading(true);
    try {
      const data = await api.neighborhoods.recommend({
        work_address: form.work_address,
        max_commute_minutes: form.max_commute_minutes,
        max_budget: form.max_budget ? +form.max_budget : undefined,
        bedrooms: form.bedrooms !== "" ? +form.bedrooms : undefined,
        preferred_transit: form.preferred_transit,
        vibe_preferences: form.vibe_preferences,
      });
      setResults(data);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const rentForBeds = (n: NeighborhoodScore["neighborhood"]) => {
    const b = form.bedrooms;
    if (b === "0") return n.avg_rent_studio;
    if (b === "1") return n.avg_rent_1br;
    if (b === "2") return n.avg_rent_2br;
    return n.avg_rent_1br ?? n.avg_rent_studio;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="text-blue-600" size={24} /> Neighborhood Finder
        </h1>
        <p className="text-slate-500 text-sm mt-1">Tell us where you work and what matters to you — we'll rank the best neighborhoods.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
        <form onSubmit={search} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Work Address *</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-2.5 text-slate-400 z-10" />
              <input
                value={addr.query}
                onChange={(e) => {
                  addr.search(e.target.value);
                  setForm({ ...form, work_address: e.target.value });
                }}
                onBlur={() => setTimeout(addr.clear, 150)}
                placeholder="e.g. 1 World Trade Center, New York, NY"
                className="w-full pl-8 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {addr.suggestions.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {addr.suggestions.map((s) => (
                    <li
                      key={s.place_name}
                      onMouseDown={() => {
                        addr.setQuery(s.place_name);
                        setForm({ ...form, work_address: s.place_name });
                        addr.clear();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer"
                    >
                      <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                      {s.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Max Commute</label>
              <select
                value={form.max_commute_minutes}
                onChange={(e) => setForm({ ...form, max_commute_minutes: +e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {[20, 30, 45, 60, 75].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Budget / mo</label>
              <input
                type="number" value={form.max_budget}
                onChange={(e) => setForm({ ...form, max_budget: e.target.value })}
                placeholder="$3,000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Bedrooms</label>
              <select
                value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Any</option>
                <option value="0">Studio</option>
                <option value="1">1 BR</option>
                <option value="2">2 BR</option>
                <option value="3">3 BR+</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Transit Mode</label>
              <select
                value={form.preferred_transit} onChange={(e) => setForm({ ...form, preferred_transit: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="subway">Subway</option>
                <option value="bus">Bus</option>
                <option value="walk">Walk/Bike</option>
                <option value="ferry">Ferry</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Neighborhood Vibe (pick any)</label>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map(({ label, value }) => {
                const active = form.vibe_preferences.includes(value);
                return (
                  <button
                    key={value} type="button" onClick={() => toggleVibe(value)}
                    className={clsx("text-xs px-3 py-1.5 rounded-full border transition-colors", active ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:border-blue-400")}
                  >{label}</button>
                );
              })}
            </div>
          </div>

          <button
            type="submit" disabled={loading || !form.work_address}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
            {loading ? "Analyzing neighborhoods..." : "Find Best Neighborhoods"}
          </button>
        </form>
      </div>

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-500">
          No neighborhoods matched your criteria. Try relaxing your commute or budget.
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-700">Top Neighborhoods for You</h2>
          {results.map((r, i) => {
            const n = r.neighborhood;
            const rent = rentForBeds(n);
            return (
              <div key={n.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0", i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : "bg-slate-100 text-slate-500")}>
                    {i === 0 ? <Star size={16} /> : `#${i + 1}`}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{n.name}</h3>
                        <p className="text-sm text-slate-500">{n.borough}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-700">{Math.round(r.score)}</div>
                        <div className="text-xs text-slate-400">score</div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mt-1.5 mb-3">{n.description}</p>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock size={14} className="text-orange-500" />
                        <span>{r.commute_description} ({r.commute_minutes} min)</span>
                      </div>
                      {rent && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <DollarSign size={14} className="text-green-600" />
                          <span>Avg ${rent.toLocaleString()}/mo</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Train size={14} className="text-blue-600" />
                        <span>{n.subway_lines.slice(0, 5).join(", ")} lines · Transit {n.transit_score}/100</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Building2 size={14} />
                        <span>{r.active_listings} active listings</span>
                      </div>
                    </div>

                    {/* Vibe tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {n.vibe_tags.map((t) => (
                        <span key={t} className={clsx("text-xs px-2.5 py-1 rounded-full capitalize", form.vibe_preferences.includes(t) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600")}>{t}</span>
                      ))}
                    </div>

                    {/* Score breakdown */}
                    <div className="mt-3 flex gap-3">
                      {Object.entries(r.score_breakdown).map(([key, val]) => (
                        <div key={key} className="text-center">
                          <div className="text-xs text-slate-400 capitalize">{key}</div>
                          <div className="text-sm font-semibold text-slate-700">{val}pts</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
