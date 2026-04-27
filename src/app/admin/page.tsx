import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Settings, Calendar, ArrowLeft, LogOut, LayoutDashboard, ShieldCheck, Gauge, Database, ListOrdered, Medal } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("admin_session")?.value === "authenticated";

  if (!isLoggedIn) {
    redirect("/login");
  }

  const adminActions = [
    { href: "/admin/programma", title: "Live Scoreboard (VAR)", desc: "Inserisci punteggi, visualizza i turni e i riposi", icon: Gauge, color: "green" },
    { href: "/admin/setup", title: "Configurazione", desc: "Definisci atleti, lettere e azzera il sistema", icon: Settings, color: "purple" },
    { href: "/admin/backup", title: "Backup e Dati", desc: "Esporta e ripristina il database", icon: Database, color: "indigo" },
    { href: "/admin/classifiche/fase1", title: "Classifica Prima Fase", desc: "Qualificazioni: Generale e Singole Discipline", icon: ListOrdered, color: "cyan" },
    { href: "/admin/classifiche/fase2", title: "Classifica Seconda Fase", desc: "Playoff, tabelloni e piazzamenti definitivi", icon: Medal, color: "amber" },
    { href: "/admin/classifiche/generale", title: "Classifica Assoluta", desc: "Vincitore finale e punteggio totale", icon: Trophy, color: "yellow" },
  ];

  return (
    <main className="min-h-screen bg-[#f5f5f7] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-blue-100 rounded-full blur-[150px] opacity-30" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-16 animate-in">
          <Link href="/" className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Sito Pubblico
          </Link>
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md py-2 px-4 rounded-2xl border border-white/50 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-[#1d1d1f]">Sessione Admin Attiva</span>
          </div>
        </div>

        <header className="mb-16 animate-in">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-[#1d1d1f]">Centrale Operativa</h1>
          </div>
          <p className="text-xl text-[#86868b] font-medium">Benvenuto nel cuore pulsante delle NOLImpiadi 2026.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in" style={{ animationDelay: '0.1s' }}>
          {adminActions.map((action) => (
            <Link href={action.href} key={action.href}>
              <PremiumCard 
                title={action.title}
                description={action.desc}
                icon={action.icon}
                color={action.color}
              />
            </Link>
          ))}
        </div>

        <footer className="mt-20 border-t border-gray-200 pt-8 flex justify-between items-center animate-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-[#86868b] font-medium italic">
            &copy; 2026 Sistema Gestionale NOLImpiadi
          </p>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold transition-colors">
              <LogOut className="w-5 h-5" />
              Termina Sessione
            </button>
          </form>
        </footer>
      </div>
    </main>
  );
}
