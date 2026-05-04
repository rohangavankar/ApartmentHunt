"use client";
import { useState } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { ListingFilters, BOROUGHS, BEDROOM_OPTIONS } from "@/lib/types";
import clsx from "clsx";

interface Props {
  filters: ListingFilters;
  onChange: (f: ListingFilters) => void;
  resultCount: number;
}

export default function MapFilters({ filters, onChange, resultCount }: Props) {
  const [open, setOpen] = useState(true);

  const toggle = (key: "boroughs", val: string) => {
    const cur = (filters[key] as string[]) ?? [];
    const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
    onChange({ ...filters, [key]: next.length ? next : undefined });
  };

  const toggleBed = (val: number) => {
    const curMin = filters.min_bedrooms;
    const curMax = filters.max_bedrooms;
    if (curMin === val && curMax === (val === 3 ? 99 : val)) {
      onChange({ ...filters, min_bedrooms: undefined, max_bedrooms: undefined });
    } else {
      onChange({ ...filters, min_bedrooms: val, max_bedrooms: val === 3 ? 99 : val });
    }
  };

  const reset = () => onChange({});

  const hasFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined
  );

  return (
    <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 font-semibold text-sm text-slate-700"
        >
          <Filter size={15} />
          Filters
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{resultCount} results</span>
          {hasFilters && (
            <button onClick={reset} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Price */}
          <section>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Price / Month</h3>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.min_price ?? ""}
                onChange={(e) => onChange({ ...filters, min_price: e.target.value ? +e.target.value : undefined })}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.max_price ?? ""}
                onChange={(e) => onChange({ ...filters, max_price: e.target.value ? +e.target.value : undefined })}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[["<$2k", undefined, 2000], ["$2-3k", 2000, 3000], ["$3-4.5k", 3000, 4500], [">$4.5k", 4500, undefined]].map(
                ([label, min, max]) => (
                  <button
                    key={label as string}
                    onClick={() => onChange({ ...filters, min_price: min as number | undefined, max_price: max as number | undefined })}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-full border transition-colors",
                      filters.min_price === min && filters.max_price === max
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-200 text-slate-600 hover:border-blue-400"
                    )}
                  >
                    {label as string}
                  </button>
                )
              )}
            </div>
          </section>

          {/* Bedrooms */}
          <section>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Bedrooms</h3>
            <div className="flex gap-2">
              {BEDROOM_OPTIONS.map(({ label, value }) => {
                const active = filters.min_bedrooms === value && filters.max_bedrooms === (value === 3 ? 99 : value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleBed(value)}
                    className={clsx(
                      "flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors",
                      active ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:border-blue-400"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Borough */}
          <section>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Borough</h3>
            <div className="space-y-1.5">
              {BOROUGHS.map((b) => {
                const active = (filters.boroughs ?? []).includes(b);
                return (
                  <label key={b} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggle("boroughs", b)}
                      className="rounded text-blue-600 focus:ring-blue-400"
                    />
                    <span className={clsx("text-sm", active ? "text-blue-700 font-medium" : "text-slate-600")}>{b}</span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
