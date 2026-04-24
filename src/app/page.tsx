import { cookies } from "next/headers";
import Link from "next/link";
import { Trophy, ClipboardList, Target, Crown, LogIn, LayoutDashboard } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

export default async function Home() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("admin_session")?.value === "authenticated";

  const publicLinks = [
    { href: "/gare", title: "Gare", desc: "Programma e risultati live", icon: ClipboardList, color: "blue" },
    { href: "/classifica", title: "Classifica", desc: "Ranking in tempo reale", icon: Crown, color: "amber" },
    { href: "/admin/finali", title: "Finali", desc: "Scontri diretti e tabelloni", icon: Target, color: "red" },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#f5f5f7]">
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[120px] opacity-50" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-20 animate-in">
          <div className="inline-flex items-center justify-center p-4 bg-white/50 backdrop-blur-xl rounded-3xl shadow-sm border border-white/50 mb-6">
            <Trophy className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-[#1d1d1f] mb-4">
            NOLImpiadi <span className="text-blue-600">2026</span>
          </h1>
          <p className="text-xl text-[#86868b] max-w-2xl mx-auto font-medium">
            L'eccellenza sportiva incontra l'innovazione digitale.
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