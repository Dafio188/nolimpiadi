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
    { href: "/admin/programma", title: "LIVE SCORE", desc: "Inserimento punteggi e gestione VAR", icon: Gauge, color: "green" },
    { href: "/admin/classifiche/fase1", title: "QUALIFICHE", desc: "Classifica prima fase e gironi", icon: ListOrdered, color: "cyan" },
    { href: "/admin/classifiche/fase2", title: "FASE FINALE", desc: "Playoff, finali e 2ª fase", icon: Medal, color: "amber" },
    { href: "/admin/classifiche/generale", title: "VINCITORE", desc: "Classifica generale assoluta e Campione 2026", icon: Trophy, color: "yellow" },
    { href: "/admin/setup", title: "CONFIGURAZIONE", desc: "Gestione atleti e ripristino per nuovo anno", icon: Settings, color: "purple" },
    { href: "/admin/backup", title: "BACKUP DATI", desc: "Esportazione e ripristino database", icon: Database, color: "indigo" },
  ];

  return (
    <div className="relative">
      {/* Background Decorativo */}
      <div className="fixed top-0 right-0 w-[60%] h-[60%] bg-blue-100 rounded-full blur-[150px] opacity-30 -z-10" />
      
      <div className="relative z-10 max-w-6xl mx-auto py-8">
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

        <footer className="mt-20 border-t border-gray-200 pt-8 animate-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-[#86868b] font-medium italic">
            &copy; 2026 Sistema Gestionale NOLImpiadi — Area Riservata
          </p>
        </footer>
      </div>
    </div>
  );
}
