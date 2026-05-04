"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/lib/types";
import { api } from "@/lib/api";
import AlertForm from "@/components/Alerts/AlertForm";
import { Bell, Trash2, ToggleLeft, ToggleRight, Loader2, Plus } from "lucide-react";
import clsx from "clsx";

function AlertsContent() {
  const searchParams = useSearchParams();
  const prefillParam = searchParams.get("prefill");
  const prefill = prefillParam ? JSON.parse(decodeURIComponent(prefillParam)) : undefined;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(!!prefill);

  const loadAlerts = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const data = await api.alerts.list(email);
      setAlerts(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (email) loadAlerts(); }, [email]);

  const toggleAlert = async (id: string, cur: boolean) => {
    await api.alerts.toggle(id, !cur);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !cur } : a));
  };

  const deleteAlert = async (id: string) => {
    if (!confirm("Delete this alert?")) return;
    await api.alerts.delete(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="text-blue-600" size={24} /> Alerts
          </h1>
          <p className="text-slate-500 text-sm mt-1">Get notified when apartments matching your criteria go live.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          <Plus size={15} /> New Alert
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-4">New Alert</h2>
          <AlertForm prefill={prefill} onCreated={() => { setShowForm(false); loadAlerts(); }} />
        </div>
      )}

      {/* Look up existing alerts by email */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
        <h2 className="font-semibold text-slate-700 mb-3">Manage Existing Alerts</h2>
        <div className="flex gap-2">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadAlerts()}
            placeholder="Enter your email to load alerts"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button onClick={loadAlerts} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-900">
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Load"}
          </button>
        </div>
      </div>

      {/* Alert list */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className={clsx("bg-white rounded-2xl border p-5 shadow-sm", a.is_active ? "border-slate-200" : "border-slate-100 opacity-60")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{a.name}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{a.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleAlert(a.id, a.is_active)} className="text-slate-400 hover:text-blue-600 transition-colors">
                    {a.is_active ? <ToggleRight size={22} className="text-blue-600" /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => deleteAlert(a.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {a.max_price && (
                  <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">Up to ${a.max_price.toLocaleString()}/mo</span>
                )}
                {a.min_bedrooms !== null && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                    {a.min_bedrooms === 0 ? "Studio" : `${a.min_bedrooms}BR`}+
                  </span>
                )}
                {a.boroughs.map((b) => (
                  <span key={b} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{b}</span>
                ))}
                {a.max_commute_minutes && (
                  <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">≤{a.max_commute_minutes} min commute</span>
                )}
                {a.required_amenities.map((am) => (
                  <span key={am} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full capitalize">{am}</span>
                ))}
              </div>

              {a.last_checked && (
                <div className="text-xs text-slate-400 mt-2">
                  Last checked: {new Date(a.last_checked).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<div className="p-8 text-slate-500">Loading...</div>}>
        <AlertsContent />
      </Suspense>
    </div>
  );
}
