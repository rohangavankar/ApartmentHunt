"use client";
import { Listing } from "@/lib/types";
import { ExternalLink, Maximize2 } from "lucide-react";

interface Props {
  listing: Listing;
  onExpand: () => void;
}

export default function ListingPopup({ listing: l, onExpand }: Props) {
  const beds = l.bedrooms === 0 ? "Studio" : `${Math.floor(l.bedrooms)} BR`;
  return (
    <div className="w-64">
      {l.images[0] && (
        <img src={l.images[0]} alt={l.title} className="w-full h-36 object-cover" />
      )}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-green-700 text-base">${l.price.toLocaleString()}/mo</div>
            <div className="text-xs text-slate-500">{beds} · {l.sqft ? `${l.sqft} sqft` : "?"}</div>
          </div>
          <button onClick={onExpand} className="text-slate-400 hover:text-blue-600 transition-colors p-1">
            <Maximize2 size={14} />
          </button>
        </div>
        <div className="text-xs text-slate-700 mt-1 truncate">{l.address}</div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{l.neighborhood}</span>
          {l.transit_score && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              Transit {l.transit_score}
            </span>
          )}
        </div>
        {l.listing_url && (
          <a
            href={l.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            View listing <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}
