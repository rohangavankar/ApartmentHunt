"use client";
import { useState } from "react";
import { AlertCreate, BOROUGHS } from "@/lib/types";
import { api } from "@/lib/api";
import { Bell, Loader2, Check } from "lucide-react";
import clsx from "clsx";

const VIBE_OPTIONS = ["dishwasher", "gym", "doorman", "in-unit laundry", "elevator", "rooftop deck", "pet-friendly"];

interface Props {
  prefill?: Partial<AlertCreate>;
  onCreated: () => void;
}

export default function AlertForm({ prefill, onCreated }: Props) {
  const [form, setForm] = useState<AlertCreate>({
    name: prefill?.name ?? "",
    email: prefill?.email ?? "",
    phone: prefill?.phone ?? "",
    min_price: prefill?.min_price,
    max_price: prefill?.max_price,
    min_bedrooms: prefill?.min_bedrooms,
    max_bedrooms: prefill?.max_bedrooms,
    boroughs: prefill?.boroughs ?? [],
    neighborhoods: prefill?.neighborhoods ?? [],
    required_amenities: prefill?.required_amenities ?? [],
    work_address: prefill?.work_address ?? "",
    max_commute_minutes: prefill?.max_commute_minutes,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBorough = (b: string) => {
    setForm((f) => ({
      ...f,
      boroughs: f.boroughs.includes(b) ? f.boroughs.filter((x) => x !== b) : [...f.boroughs, b],
    }));
  };

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      required_amenities: f.required_amenities.includes(a)
        ? f.required_amenities.filter((x) => x !== a)
        : [...f.required_amenities, a],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError("Name and email are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: AlertCreate = {
        ...form,
        phone: form.phone || undefined,
        work_address: form.work_address || undefined,
      };
      await api.alerts.create(payload);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onCreated(); }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create alert.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Alert Name *</label>
          <input
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. 1BR in Brooklyn"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
          <input
            type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Phone (SMS, optional)</label>
          <input
            type="tel" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 555 000 0000"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Max Commute (min)</label>
          <select
            value={form.max_commute_minutes ?? ""}
            onChange={(e) => setForm({ ...form, max_commute_minutes: e.target.value ? +e.target.value : undefined })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Any</option>
            {[20, 30, 45, 60, 75].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Min Price</label>
          <input
            type="number" value={form.min_price ?? ""} onChange={(e) => setForm({ ...form, min_price: e.target.value ? +e.target.value : undefined })}
            placeholder="$0"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Max Price</label>
          <input
            type="number" value={form.max_price ?? ""} onChange={(e) => setForm({ ...form, max_price: e.target.value ? +e.target.value : undefined })}
            placeholder="No limit"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2">Bedrooms</label>
        <div className="flex gap-2">
          {[{ label: "Studio", v: 0 }, { label: "1BR", v: 1 }, { label: "2BR", v: 2 }, { label: "3BR+", v: 3 }].map(({ label, v }) => {
            const active = form.min_bedrooms === v;
            return (
              <button
                key={v} type="button"
                onClick={() => setForm({ ...form, min_bedrooms: active ? undefined : v, max_bedrooms: active ? undefined : (v === 3 ? 99 : v) })}
                className={clsx("flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors", active ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:border-blue-400")}
              >{label}</button>
            );
          })}
        </div>
      </div>

      {/* Boroughs */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2">Boroughs</label>
        <div className="flex flex-wrap gap-2">
          {BOROUGHS.map((b) => {
            const active = form.boroughs.includes(b);
            return (
              <button
                key={b} type="button" onClick={() => toggleBorough(b)}
                className={clsx("text-xs px-3 py-1.5 rounded-full border transition-colors", active ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:border-blue-400")}
              >{b}</button>
            );
          })}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2">Must-have Amenities</label>
        <div className="flex flex-wrap gap-2">
          {VIBE_OPTIONS.map((a) => {
            const active = form.required_amenities.includes(a);
            return (
              <button
                key={a} type="button" onClick={() => toggleAmenity(a)}
                className={clsx("text-xs px-3 py-1.5 rounded-full border transition-colors capitalize", active ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 text-slate-600 hover:border-emerald-400")}
              >{a}</button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit" disabled={loading || success}
        className={clsx("w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors", success ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : success ? <Check size={16} /> : <Bell size={16} />}
        {loading ? "Creating..." : success ? "Alert Created!" : "Create Alert"}
      </button>
    </form>
  );
}
