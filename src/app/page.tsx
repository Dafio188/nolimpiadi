import { cookies } from "next/headers";
import Link from "next/link";
import { Trophy, ClipboardList, Target, Crown, LogIn, LayoutDashboard, Clock, MapPin, Star, ArrowRight } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";
import FantaNoliInvitation from "@/components/ui/FantaNoliInvitation";
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
            <div className="bg-white/70 backdrop-blur-2xl p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border border-white shadow-xl shadow-blue-500/5">
              <h2 className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-blue-600 mb-4 lg:mb-6">Dettagli Ufficiali</h2>
              <div className="space-y-4 lg:space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-2 lg:p-3 rounded-xl lg:rounded-2xl text-blue-600">
                    <Clock className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Quando</p>
                    <p className="text-lg lg:text-xl font-black text-[#1d1d1f]">Domenica 17 Maggio 2026</p>
                    <p className="text-sm font-medium text-zinc-500">Ore 13:45</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-amber-50 p-2 lg:p-3 rounded-xl lg:rounded-2xl text-amber-600">
                    <MapPin className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Ritrovo</p>
                    <p className="text-lg lg:text-xl font-black text-[#1d1d1f]">Sacro Tempio Nolimpico</p>
                    <p className="text-sm font-medium text-zinc-500">(alias casa di Pietro)</p>
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

        {/* Gare & Discipline Section */}
        <section className="mb-20 animate-in" style={{ animationDelay: '0.2s' }}>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[36px] blur-xl opacity-10 group-hover:opacity-20 transition duration-1000" />
            <div className="relative bg-white/80 backdrop-blur-3xl border border-white/50 rounded-[32px] p-8 lg:p-12 shadow-2xl overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-12 items-center">
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                    <Target className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Le GARE 2026</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-[#1d1d1f] tracking-tight">
                    Le Quattro Discipline <br />
                    <span className="text-blue-600 italic">della Gloria.</span>
                  </h2>
                  <p className="text-lg text-[#86868b] font-medium leading-relaxed">
                    Dalle freccette millimetriche alla velocità pura dell&apos;air hockey. Ogni disciplina mette alla prova un talento diverso. Sei pronto a dominarle tutte?
                  </p>
                  <div className="pt-4">
                    <Link 
                      href="/gare"
                      className="group/btn flex items-center gap-3 w-fit px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-200 transition-all duration-300"
                    >
                      SCOPRI IL REGOLAMENTO GARE
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                  {[
                    { name: "Ping Pong", img: "/immagini/ping%20pong.png", color: "bg-blue-50" },
                    { name: "Calcio Balilla", img: "/immagini/Calcio-balilla.png", color: "bg-amber-50" },
                    { name: "Freccette", img: "/immagini/Freccette.png", color: "bg-red-50" },
                    { name: "Air Hockey", img: "/immagini/Air%20Hockey.png", color: "bg-cyan-50" },
                  ].map((gara, i) => (
                    <Link key={i} href="/gare" className="group/card relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-white hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                      <img src={gara.img} className="w-full h-full object-cover" alt={gara.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover/card:translate-y-0 transition-transform duration-300">
                        <p className="text-white text-xs font-black uppercase tracking-widest">{gara.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Griglia Pubblica rimossa in favore della Navbar */}

        {/* Hall of Fame Teaser */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[3rem] p-8 md:p-16 relative overflow-hidden group">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] group-hover:bg-blue-500/30 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-amber-400 mb-6">
                  <Trophy className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Albo d'Oro</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                  Entra nel <span className="text-amber-400">Mito.</span>
                </h2>
                <p className="text-xl text-zinc-400 font-medium mb-8 leading-relaxed">
                  Dal 2018 ad oggi, scopri i nomi di chi ha trionfato nel Sacro Tempio e ha scritto la storia delle NOLImpiadi.
                </p>
                <Link 
                  href="/albo-doro" 
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white rounded-2xl text-black font-black hover:bg-zinc-100 transition-all active:scale-95"
                >
                  VEDI TUTTE LE EDIZIONI
                  <Crown className="w-5 h-5 text-amber-500" />
                </Link>
              </div>
              
              {/* Podium Preview */}
              <div className="flex-1 w-full max-w-sm">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { pos: "1°", name: "Pietro Noli", titles: "3 Titoli", color: "text-amber-400", bg: "bg-amber-400/10" },
                    { pos: "2°", name: "Massimo Robutti", titles: "2 Titoli", color: "text-zinc-300", bg: "bg-zinc-300/10" },
                    { pos: "3°", name: "Stefano Mortola", titles: "Campione 2024", color: "text-orange-400", bg: "bg-orange-400/10" },
                  ].map((hero, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center justify-between group-hover:translate-x-2 transition-transform duration-500" style={{ transitionDelay: `${i * 100}ms` }}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${hero.bg} flex items-center justify-center font-black ${hero.color}`}>
                          {hero.pos}
                        </div>
                        <div>
                          <p className="text-white font-black">{hero.name}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{hero.titles}</p>
                        </div>
                      </div>
                      <Star className={`w-4 h-4 ${hero.color} fill-current opacity-20`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FantaNolimpiadi Invitation Section */}
        <section id="fanta" className="mb-20 space-y-8 scroll-mt-24">
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