"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Bell, Map, MessageSquare, Building2 } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/",              label: "Map",            icon: Map },
  { href: "/neighborhoods", label: "Neighborhoods",  icon: Building2 },
  { href: "/alerts",        label: "Alerts",         icon: Bell },
  { href: "/chat",          label: "AI Chat",        icon: MessageSquare },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="h-14 bg-brand-900 text-white flex items-center px-4 gap-6 shadow-lg z-50 relative">
      <Link href="/" className="flex items-center gap-1.5 font-bold text-lg mr-4">
        <MapPin className="text-blue-400" size={20} />
        <span>ApartHunt</span>
        <span className="text-blue-400 text-xs font-normal ml-1">NYC</span>
      </Link>

      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors",
            path === href
              ? "bg-blue-600 text-white"
              : "text-slate-300 hover:text-white hover:bg-white/10"
          )}
        >
          <Icon size={16} />
          {label}
        </Link>
      ))}

      <div className="ml-auto text-xs text-slate-400">
        NYC + Jersey City · Summer 2025
      </div>
    </nav>
  );
}
