import Link from "next/link";
import { ArrowLeft, Medal } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

export default function ClassificaFase2Placeholder() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <Link 
          href="/admin" 
          className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Dashboard
        </Link>
      </div>

      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
          <Medal className="w-10 h-10 text-amber-500" />
          Classifica <span className="text-amber-500">Seconda Fase</span>
        </h1>
        <p className="mt-2 text-zinc-500 font-medium">Gestione dei tabelloni finali e piazzamenti definitivi (Fase 3 del progetto in arrivo).</p>
      </header>

      <PremiumCard className="p-12 text-center border-none ring-1 ring-amber-500/30 bg-amber-50/50">
        <Medal className="w-16 h-16 text-amber-500 mx-auto mb-6 opacity-50" />
        <h2 className="text-2xl font-black text-amber-900 mb-2">Sezione in Costruzione</h2>
        <p className="text-amber-700 font-medium max-w-lg mx-auto">
          In questa sezione verranno generati automaticamente i tabelloni per le finali (Quarti, Semifinali e Finali) 
          prendendo i primi classificati dalla Fase 1, secondo lo schema dell'anno precedente.
        </p>
      </PremiumCard>
    </div>
  );
}
