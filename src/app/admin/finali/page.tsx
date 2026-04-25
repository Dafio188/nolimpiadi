import FinaliClient from "./FinaliClient";
import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";

export default function FinaliPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-accent transition-colors group">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Pannello Admin
          </Link>
          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-400">
            <Link href="/classifica" className="hover:text-accent transition-colors">Classifica</Link>
            <span className="w-1 h-1 rounded-full bg-zinc-200" />
            <Link href="/gare" className="hover:text-accent transition-colors">Gare</Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-accent" />
              <span className="text-xs font-black text-accent uppercase tracking-[0.2em]">The Golden Stage</span>
            </div>
            <h1 className="text-5xl font-black text-foreground tracking-tight">Finali Olimpiche</h1>
            <p className="text-zinc-500 font-bold mt-2">Tabelloni e qualificati per la fase finale della competizione.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <FinaliClient />
    </div>
  );
}
