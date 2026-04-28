import Link from "next/link";
import { ArrowLeft, Medal } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

export default function ClassificaFase2Placeholder() {
  return (
    <div className="mx-auto w-full max-w-7xl">

      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
          <Medal className="w-10 h-10 text-amber-500" />
          FASE FINALE
        </h1>
        <p className="mt-2 text-zinc-500 font-medium">Playoff, finali e 2ª fase.</p>
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
