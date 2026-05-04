import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/UI/Navbar";

export const metadata: Metadata = {
  title: "ApartHunt — NYC Apartment Finder",
  description: "Find the best apartments in NYC and Jersey City with real-time alerts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <main className="h-[calc(100vh-56px)]">{children}</main>
      </body>
    </html>
  );
}
