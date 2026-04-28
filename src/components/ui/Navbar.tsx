"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, LogIn } from "lucide-react";

interface NavbarProps {
  isLoggedIn: boolean;
}

export default function Navbar({ isLoggedIn }: NavbarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAdmin = pathname?.startsWith("/admin");
  const isGiudici = pathname?.startsWith("/giudici");
  const isLogin = pathname === "/login";

  if (isAdmin || isGiudici || isLogin) return null;

  const navLinks = [
    { name: "GARE", href: "/gare" },
    { name: "FANTA", href: isHome ? "#fanta" : "/#fanta" },
    { name: "MENÙ", href: isHome ? "#menu" : "/#menu" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[100] px-4 py-3"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-3xl px-4 md:px-8 py-3 flex items-center justify-between">
            {/* Logo & Brand */}
            <Link href="/" className="flex items-center gap-3 group transition-all duration-300">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm border border-zinc-100 p-0.5 group-hover:scale-110 transition-transform duration-500">
                <img 
                  src="/immagini/stemma.jpeg" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tighter text-[#1d1d1f]">NOLImpiadi</span>
                <span className="text-[10px] font-bold text-blue-600 italic -mt-1">2026</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-[11px] font-black tracking-[0.2em] text-zinc-500 hover:text-blue-600 transition-colors duration-300"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Admin / Login Button */}
            <Link 
              href={isLoggedIn ? "/admin" : "/login"}
              className="group flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-2xl text-[10px] font-black tracking-wider text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200 transition-all duration-300"
            >
              {isLoggedIn ? (
                <LayoutDashboard className="w-3.5 h-3.5" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isLoggedIn ? "ADMIN" : "AREA RISERVATA"}
              </span>
            </Link>
          </div>
        </div>
      </motion.nav>
      {/* Spacer to push content below the fixed Navbar */}
      <div className="h-20 md:h-24" />
    </>
  );
}
