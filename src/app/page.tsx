import { cookies } from "next/headers";
import Link from "next/link";
import { Trophy, ClipboardList, Target, Crown, LogIn, LayoutDashboard } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("admin_session")?.value === "authenticated";

  const publicLinks = [
    { href: "/gare", title: "Gare", desc: "Programma e risultati live", icon: ClipboardList, color: "blue" },
    { href: "/classifica", title: "Classifica", desc: "Ranking in tempo reale", icon: Crown, color: "amber" },
    { href: "/admin/finali", title: "Finali", desc: "Scontri diretti e tabelloni", icon: Target, color: "red" },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-zinc-50">
      {/* Background Sportivo Dinamico */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Linee Cinetiche */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" 
             style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0px, #000 1px, transparent 1px, transparent 100px)' }} />
        
        {/* Sfumature Energetiche */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-gradient-to-tl from-red-400/20 to-transparent rounded-full blur-[120px]" />
        
        {/* Fasce Sportive Diagonali */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[400px] bg-white/40 -rotate-12 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-20 animate-in">
          <div className="inline-flex items-center justify-center p-5 bg-white rounded-3xl shadow-xl shadow-blue-500/10 border border-zinc-100 mb-8 relative">
            <Trophy className="w-14 h-14 text-blue-600 relative z-10" />
            <div className="absolute inset-0 bg-blue-500/5 rounded-3xl blur-xl" />
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-zinc-900 mb-6 uppercase">
            NOLImpiadi <span className="text-blue-600">2026</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed">
            12 Amici. 4 Discipline. <span className="text-zinc-900 font-bold">Unico Obiettivo: Divertirse!</span>
          </p>
        </header>

        {/* Grid Pubblica */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in" style={{ animationDelay: '0.1s' }}>
          {publicLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              <PremiumCard 
                title={link.title}
                description={link.desc}
                icon={link.icon}
                color={link.color}
              />
            </Link>
          ))}
        </div>

        {/* Footer / Link Admin */}
        <footer className="mt-24 text-center animate-in" style={{ animationDelay: '0.3s' }}>
          {!isLoggedIn ? (
            <Link href="/login" className="apple-button gap-2">
              <LogIn className="w-5 h-5" />
              Area Riservata
            </Link>
          ) : (
            <Link href="/admin" className="apple-button gap-2 bg-purple-600 hover:bg-purple-700">
              <LayoutDashboard className="w-5 h-5" />
              Vai al Pannello Admin
            </Link>
          )}
        </footer>
      </div>
    </main>
  );
}