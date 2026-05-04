"use client";
import { Listing } from "@/lib/types";
import { X, ExternalLink, MapPin, Train, Footprints, Calendar, Check, Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Props {
  listing: Listing;
  onClose: () => void;
}

export default function ListingModal({ listing: l, onClose }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const beds = l.bedrooms === 0 ? "Studio" : `${Math.floor(l.bedrooms)} BR`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Images */}
        <div className="relative h-56 bg-slate-100 rounded-t-2xl overflow-hidden">
          {l.images.length > 0 ? (
            <>
              <img src={l.images[imgIdx]} alt={l.title} className="w-full h-full object-cover" />
              {l.images.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {l.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">No photos</div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* Price + title */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-2xl font-bold text-green-700">${l.price.toLocaleString()}<span className="text-sm font-normal text-slate-500">/mo</span></div>
              <div className="text-slate-500 text-sm">{beds} · {l.bathrooms ? `${l.bathrooms} bath` : ""} {l.sqft ? `· ${l.sqft.toLocaleString()} sqft` : ""}</div>
            </div>
            <div className="flex gap-2">
              {l.listing_url && (
                <a href={l.listing_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                  View <ExternalLink size={13} />
                </a>
              )}
              <Link href={`/alerts?prefill=${encodeURIComponent(JSON.stringify({ max_price: l.price + 500, boroughs: [l.borough], neighborhoods: [l.neighborhood] }))}`}
                className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                <Bell size={13} /> Alert
              </Link>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-slate-600 text-sm mb-4">
            <MapPin size={14} className="text-slate-400" />
            {l.address}
          </div>

          {/* Scores */}
          <div className="flex gap-3 mb-4">
            {l.transit_score !== null && (
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm">
                <Train size={13} /> Transit {l.transit_score}/100
              </div>
            )}
            {l.walk_score !== null && (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm">
                <Footprints size={13} /> Walk {l.walk_score}/100
              </div>
            )}
            {l.available_date && (
              <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-sm">
                <Calendar size={13} /> Avail {new Date(l.available_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            )}
          </div>

          {/* Description */}
          {l.description && (
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">{l.description}</p>
          )}

          {/* Amenities */}
          {l.amenities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {l.amenities.map((a) => (
                  <span key={a} className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    <Check size={10} className="text-green-500" /> {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
