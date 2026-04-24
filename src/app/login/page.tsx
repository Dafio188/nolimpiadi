"use client";

import { LogIn, Lock, Mail, ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50 rounded-full blur-[120px] opacity-40" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Torna alla Dashboard</span>
        </Link>

        <div className="glass-panel p-10 rounded-[40px] border border-white/50 shadow-2xl animate-in">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-600 rounded-3xl shadow-lg mb-6">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-[#1d1d1f] mb-2">Area Admin</h1>
            <p className="text-[#86868b] font-medium">Inserisci le tue credenziali</p>
          </div>

          <form action="/api/auth/login" method="POST" className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1d1d1f] ml-1">Username</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                <input
                  name="username"
                  type="text"
                  className="w-full bg-[#f5f5f7] border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1d1d1f] ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                <input
                  name="password"
                  type="password"
                  className="w-full bg-[#f5f5f7] border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error === "credenziali" && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold text-center">
                Credenziali non valide. Riprova.
              </div>
            )}

            <button type="submit" className="apple-button w-full py-4 text-lg">
              <LogIn className="w-5 h-5 mr-2" />
              Accedi al Sistema
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-sm text-[#86868b] font-medium">
          Proprietà riservata Associazione Noli &copy; 2026
        </p>
      </div>
    </div>
  );
}