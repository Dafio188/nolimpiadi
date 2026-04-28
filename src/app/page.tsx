import { cookies } from "next/headers";
import Link from "next/link";
import { Trophy, ClipboardList, Target, Crown, LogIn, LayoutDashboard, Clock, MapPin } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";
import FantaNoliInvitation from "@/components/ui/FantaNoliInvitation";
import FantaNoliBanner from "@/components/ui/FantaNoliBanner";
import MenuNolimpicoCard from "@/components/ui/MenuNolimpicoCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("admin_session")?.value === "authenticated";

  // Rimosso publicLinks per navigazione via Navbar

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#f5f5f7]">
      {/* Background Decorativo Pulito */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[120px] opacity-50" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Navigazione spostata nella Navbar globale */}

        <header className="text-center mb-16 animate-in">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#1d1d1f] mb-6">
            NOLImpiadi <span className="text-blue-600 italic">2026</span>
          </h1>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-2xl md:text-3xl font-bold text-[#1d1d1f] leading-tight mb-6">
              La leggenda continua. <br className="hidden md:block" /> 
              La <span className="text-blue-600">7ª edizione</span> è ufficialmente indetta!
            </p>
            <p className="text-lg text-[#86868b] font-medium leading-relaxed">
              Sì, avete letto bene: la sfavillante, roboante e fantasmagorica edizione del più prestigioso (e controverso) torneo multisportivo del multiverso sta per tornare. 
            </p>
          </div>
        </header>

        {/* Hero Section con Collage e Info */}
        <section className="mb-20 grid md:grid-cols-2 gap-8 lg:gap-16 items-center animate-in" style={{ animationDelay: '0.1s' }}>
          {/* Collage Griglia 2x2 */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl shadow-blue-200/40 ring-1 ring-black/5 rotate-[-1deg] max-w-md mx-auto md:mx-0">
            <div className="aspect-square rounded-xl lg:rounded-2xl overflow-hidden">
              <img src="/immagini/ping%20pong.png" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Ping Pong" />
            </div>
            <div className="aspect-square rounded-xl lg:rounded-2xl overflow-hidden">
              <img src="/immagini/Calcio-balilla.png" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Calcio Balilla" />
            </div>
            <div className="aspect-square rounded-xl lg:rounded-2xl overflow-hidden">
              <img src="/immagini/Freccette.png" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Freccette" />
            </div>
            <div className="aspect-square rounded-xl lg:rounded-2xl overflow-hidden">
              <img src="/immagini/Air%20Hockey.png" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Air Hockey" />
            </div>
          </div>

          {/* Info Box */}
          <div className="flex flex-col gap-6 lg:gap-8">
            <div className="bg-white/70 backdrop-blur-2xl p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border border-white shadow-xl">
              <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-blue-600 mb-4 lg:mb-6">Dettagli Ufficiali</h2>
              <div className="space-y-4 lg:space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-2 lg:p-3 rounded-xl lg:rounded-2xl text-blue-600">
                    <Clock className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Quando</p>
                    <p className="text-lg lg:text-xl font-black text-[#1d1d1f]">Domenica 17 Maggio 2026, ore 13:45</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-amber-50 p-2 lg:p-3 rounded-xl lg:rounded-2xl text-amber-600">
                    <MapPin className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Ritrovo</p>
                    <p className="text-lg lg:text-xl font-black text-[#1d1d1f]">Sacro Tempio Nolimpico, alias Casa Mia</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-2">
              <p className="text-sm lg:text-base text-[#86868b] font-medium italic leading-relaxed">
                Preparate i riflessi, scaldate i muscoli e affilate la strategia. <br className="hidden lg:block" />
                La gloria vi aspetta.
              </p>
            </div>
          </div>
        </section>

        {/* Griglia Pubblica rimossa in favore della Navbar */}

        {/* FantaNolimpiadi Invitation Section */}
        <section id="fanta" className="mb-20 space-y-8 scroll-mt-24">
          <FantaNoliBanner />
          <FantaNoliInvitation formUrl="https://docs.google.com/forms/d/e/1FAIpQLSfL65wUBiXLybCVxkkYNBd2-H_jC5CoAyqugaJqHdzHpa8z0w/viewform" />
        </section>

        {/* Menù Nolimpico */}
        <section id="menu" className="mb-20 scroll-mt-24">
          <MenuNolimpicoCard pdfUrl="/documenti/Menu%20Nolimpico.pdf" />
        </section>

        <footer className="mt-24 pb-12 text-center animate-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">
            NOLImpiadi 2026 • Official Tournament Dashboard
          </p>
        </footer>
      </div>
    </main>
  );
}