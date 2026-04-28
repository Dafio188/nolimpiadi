import FinaliClient from "./FinaliClient";
import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";

export default function FinaliPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">

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
