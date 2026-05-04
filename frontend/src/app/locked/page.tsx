import { MapPin } from "lucide-react";

export default function LockedPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <MapPin className="text-blue-400" size={28} />
          <span className="text-white font-bold text-2xl">ApartHunt</span>
          <span className="text-blue-400 text-sm font-normal">NYC</span>
        </div>
        <h1 className="text-white text-xl font-semibold mb-3">Invite only</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          This app is in private beta. Ask Rohan for an invite link to get access.
        </p>
      </div>
    </div>
  );
}
