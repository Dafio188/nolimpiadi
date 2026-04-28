"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Settings, Trophy, LogOut,
  ShieldCheck, Gauge, Database, ListOrdered, Medal,
  LayoutDashboard
} from "lucide-react";

export default function AdminNavbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "LIVE SCORE", href: "/admin/programma", icon: Gauge },
    { name: "QUALIFICHE", href: "/admin/classifiche/fase1", icon: ListOrdered },
    { name: "FASE FINALE", href: "/admin/classifiche/fase2", icon: Medal },
    { name: "VINCITORE", href: "/admin/classifiche/generale", icon: Trophy },
    { name: "CONFIGURAZIONE", href: "/admin/setup", icon: Settings },
    { name: "BACKUP DATI", href: "/admin/backup", icon: Database },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[100] px-4 py-3"
      >
        <div className="max-w-[1600px] mx-auto">
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl px-4 md:px-6 py-2 flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className="text-xs font-black tracking-tighter text-white">ADMIN PANEL</span>
                  <span className="text-[9px] font-bold text-blue-400 italic -mt-1">NOLImpiadi 2026</span>
                </div>
              </Link>
              
              <div className="h-8 w-px bg-white/10 mx-2 hidden lg:block" />

              {/* Navigation Links */}
              <div className="hidden xl:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black tracking-wider transition-all duration-300 ${
                        isActive 
                          ? "bg-white/10 text-white shadow-inner" 
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <link.icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : ""}`} />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              
              <form action="/api/auth/logout" method="POST">
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black tracking-wider transition-all duration-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ESCI</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </motion.nav>
      {/* Spacer */}
      <div className="h-20 md:h-22" />
    </>
  );
}
