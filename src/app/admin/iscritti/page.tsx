export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

import Link from "next/link";
import { Users, ArrowLeft, Search, UserPlus, Filter, ShieldCheck, Mail, Phone, Trophy } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

export default async function IscrittiPage() {
  const athletes = await prisma.athlete.findMany({
    orderBy: { name: "asc" },
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "ALTO": return "text-red-600 bg-red-50 border-red-100";
      case "MEDIO": return "text-amber-600 bg-amber-50 border-amber-100";
      case "BASSO": return "text-green-600 bg-green-50 border-green-100";
      default: return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/admin" className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Centrale
          </Link>
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md py-2 px-4 rounded-2xl border border-white/50 shadow-sm">
            <Users className="w-5 h-5 text-cyan-600" />
            <span className="text-sm font-bold text-[#1d1d1f]">Database Atleti</span>
          </div>
        </div>

        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-[#1d1d1f] mb-4">Iscritti NOLImpiadi</h1>
              <p className="text-xl text-[#86868b] font-medium">Gestione completa dell'anagrafica e delle categorie dei partecipanti.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/setup" className="bg-white hover:bg-gray-50 text-[#1d1d1f] px-6 py-3 rounded-2xl font-bold border border-gray-200 shadow-sm transition-all flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtra
              </Link>
              <Link href="/admin/setup" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Nuovo Atleta
              </Link>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/50">
            <p className="text-[#86868b] text-xs font-black uppercase tracking-widest mb-2">Totale Iscritti</p>
            <h3 className="text-3xl font-black text-[#1d1d1f]">{athletes.length}</h3>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/50">
            <p className="text-[#86868b] text-xs font-black uppercase tracking-widest mb-2 text-red-500">Tier Alto</p>
            <h3 className="text-3xl font-black text-[#1d1d1f]">{(athletes as any[]).filter(a => a.tier === "ALTO").length}</h3>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/50">
            <p className="text-[#86868b] text-xs font-black uppercase tracking-widest mb-2 text-amber-500">Tier Medio</p>
            <h3 className="text-3xl font-black text-[#1d1d1f]">{(athletes as any[]).filter(a => a.tier === "MEDIO").length}</h3>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/50">
            <p className="text-[#86868b] text-xs font-black uppercase tracking-widest mb-2 text-green-500">Tier Basso</p>
            <h3 className="text-3xl font-black text-[#1d1d1f]">{(athletes as any[]).filter(a => a.tier === "BASSO").length}</h3>
          </div>
        </div>

        {/* Athletes List */}
        <div className="bg-white rounded-[32px] shadow-sm border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
              <input 
                type="text" 
                placeholder="Cerca un atleta per nome..."
                className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3 text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[#86868b] text-xs font-black uppercase tracking-widest">
                  <th className="px-8 py-6">Atleta</th>
                  <th className="px-8 py-6">Tier</th>
                  <th className="px-8 py-6">Punteggio Categoria</th>
                  <th className="px-8 py-6 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {athletes.map((athlete: any) => (
                  <tr key={athlete.id} className="hover:bg-[#f5f5f7]/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-black text-gray-500">
                          {athlete.name.charAt(0)}
                        </div>
                        <span className="text-lg font-bold text-[#1d1d1f]">{athlete.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${getTierColor(athlete.tier)}`}>
                        {athlete.tier}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-[#1d1d1f]">{athlete.categoryScore}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link 
                        href={`/admin/setup`}
                        className="text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Modifica
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
