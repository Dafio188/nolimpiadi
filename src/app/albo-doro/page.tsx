import { Trophy, Medal, Star, Calendar, Users, ArrowRight, Target, Zap, Activity, Dumbbell } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import { cookies } from "next/headers";

const EDITIONS = [
  {
    id: 6,
    title: "6° Edizione",
    date: "23 Giugno 2024",
    results: [
      { pos: 1, name: "Stefano Mortola" },
      { pos: 2, name: "Alessandro Robutti" },
      { pos: 3, name: "Massimo Robutti" },
      { pos: 4, name: "Gianni Teti" },
      { pos: 5, name: "Alberto Robutti" },
      { pos: 6, name: "Pietro Noli" },
      { pos: 7, name: "Gianluca Bozzia" },
      { pos: 8, name: "Magda Seminara" },
      { pos: 9, name: "Camila Bozzia" },
      { pos: 10, name: "Matheus Interliggi" },
      { pos: 11, name: "Emma Tira" },
      { pos: 12, name: "Aurelio Piccione" },
    ],
    disciplines: [
      { name: "Ping Pong", winner: "Stefano M.", icon: Activity },
      { name: "Calcio Balilla", winner: "Alessandro R.", icon: Users },
      { name: "Freccette", winner: "Massimo R.", icon: Target },
      { name: "Air Hockey", winner: "Stefano M.", icon: Zap },
    ]
  },
  {
    id: 5,
    title: "5° Edizione",
    date: "18 Giugno 2023",
    results: [
      { pos: 1, name: "Pietro Noli" },
      { pos: 2, name: "Gianni Teti" },
      { pos: 3, name: "Alessandro Robutti" },
      { pos: 4, name: "Alessandro Cioccariello" },
      { pos: 5, name: "Giorgio Popolizio" },
      { pos: 6, name: "Claudia Barzaghi" },
      { pos: 7, name: "Gianluca Bozzia" },
      { pos: 8, name: "Massimo Robutti" },
      { pos: 9, name: "Matheus Interliggi" },
      { pos: 10, name: "Aurelio Piccione" },
      { pos: 11, name: "Magda Seminara" },
      { pos: 12, name: "Emma Tira" },
    ],
    disciplines: [
      { name: "Ping Pong", winner: "Pietro N.", icon: Activity },
      { name: "Calcio Balilla", winner: "Gianni T.", icon: Users },
      { name: "Freccette", winner: "Pietro N.", icon: Target },
      { name: "Air Hockey", winner: "Pietro N.", icon: Zap },
    ]
  },
  {
    id: 4,
    title: "4° Edizione",
    date: "7 Aprile 2019",
    results: [
      { pos: 1, name: "Massimo Robutti" },
      { pos: 2, name: "Pietro Noli" },
      { pos: 3, name: "Gianni Teti" },
      { pos: 4, name: "Roberto Macrì" },
      { pos: 5, name: "Stefano Tiranzoni" },
      { pos: 6, name: "Alessandro Robutti" },
      { pos: 7, name: "Mirella Boffano" },
      { pos: 8, name: "Salvatore Barretta" },
      { pos: 9, name: "Patrizia Interliggi" },
      { pos: 10, name: "Aurelio Piccione" },
      { pos: 11, name: "Barbara Marino" },
      { pos: 12, name: "Matheus Interliggi" },
    ],
    disciplines: [
      { name: "Ping Pong", winner: "Massimo R.", icon: Activity },
      { name: "Calcio Balilla", winner: "Pietro N.", icon: Users },
      { name: "Freccette", winner: "Gianni T.", icon: Target },
      { name: "Air Hockey", winner: "Massimo R.", icon: Zap },
    ]
  },
  {
    id: 3,
    title: "3° Edizione",
    date: "21 Ottobre 2018",
    results: [
      { pos: 1, name: "Massimo Robutti" },
      { pos: 2, name: "Salvatore Barretta" },
      { pos: 3, name: "Pietro Noli" },
      { pos: 4, name: "Vito Albanese" },
      { pos: 5, name: "Alessandro Robutti" },
      { pos: 6, name: "Valeriano Seminara" },
      { pos: 7, name: "Stefano Tiranzoni" },
      { pos: 8, name: "Patrizia Interliggi" },
      { pos: 9, name: "Barbara Marino" },
      { pos: 10, name: "Aurelio Piccione" },
      { pos: 11, name: "Silvana Giacchi" },
      { pos: 12, name: "Matheus Interliggi" },
    ],
    disciplines: [
      { name: "Ping Pong", winner: "Massimo R.", icon: Activity },
      { name: "Calcio Balilla", winner: "Salvatore B.", icon: Users },
      { name: "Freccette", winner: "Massimo R.", icon: Target },
      { name: "Air Hockey", winner: "Massimo R.", icon: Zap },
    ]
  },
  {
    id: 2,
    title: "2° Edizione",
    date: "1 Luglio 2018",
    results: [
      { pos: 1, name: "Pietro Noli" },
      { pos: 2, name: "Massimo Robutti" },
      { pos: 3, name: "Salvatore Barretta" },
      { pos: 4, name: "Vito Albanese" },
      { pos: 5, name: "Lapo Bernardini" },
      { pos: 6, name: "Patrizia Interliggi" },
      { pos: 7, name: "Barbara Marino" },
      { pos: 8, name: "Gabriele Piccione" },
      { pos: 9, name: "Caterina Mamone" },
      { pos: 10, name: "Matheus Interliggi" },
      { pos: 11, name: "Alessandro Robutti" },
      { pos: 12, name: "Aurelio Piccione" },
    ],
    disciplines: [
      { name: "Ping Pong", winner: "Pietro N.", icon: Activity },
      { name: "Calcio Balilla", winner: "Massimo R.", icon: Users },
      { name: "Freccette", winner: "Salvatore B.", icon: Target },
      { name: "Air Hockey", winner: "Pietro N.", icon: Zap },
    ]
  },
  {
    id: 1,
    title: "1° Edizione",
    date: "4 Marzo 2018",
    results: [
      { pos: 1, name: "Pietro Noli" },
      { pos: 2, name: "Gianni Teti" },
      { pos: 3, name: "Massimo Robutti" },
      { pos: 4, name: "Stefano Bisoglio" },
      { pos: 5, name: "Valeriano S. / Doris" },
      { pos: 6, name: "Andrea Spada" },
      { pos: 7, name: "Vito Albanese" },
      { pos: 8, name: "Sergio P. / Mirella B." },
      { pos: 9, name: "Flavio B. / Caterina M." },
      { pos: 10, name: "Aurelio Piccione" },
      { pos: 11, name: "Patrizia Interliggi" },
      { pos: 12, name: "Matheus Interliggi" },
    ],
    disciplines: [
      { name: "Ping Pong", winner: "Pietro N.", icon: Activity },
      { name: "Calcio Balilla", winner: "Gianni T.", icon: Users },
      { name: "Freccette", winner: "Massimo R.", icon: Target },
      { name: "Air Hockey", winner: "Pietro N.", icon: Zap },
    ]
  },
];

export default async function AlboDoroPage() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("admin_session")?.value === "authenticated";

  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 mb-8">
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Hall of Fame</span>
          </div>
          <div className="flex items-center justify-center gap-6 mb-8">
            <img 
              src="/immagini/mascot/Nolimpius vincitore.png" 
              className="hidden md:block w-24 h-24 object-contain scale-x-[-1]" 
              alt="Winner Left" 
            />
            <h1 className="text-6xl md:text-8xl font-black text-[#1d1d1f] tracking-tight">
              Albo d&apos;Oro <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">NOLImpiadi</span>
            </h1>
            <img 
              src="/immagini/mascot/Nolimpius vincitore.png" 
              className="hidden md:block w-24 h-24 object-contain" 
              alt="Winner Right" 
            />
          </div>
          <p className="text-xl md:text-2xl text-[#86868b] font-medium max-w-3xl mx-auto">
            La storia, i campioni e le leggende che hanno reso indimenticabile ogni singola edizione.
          </p>
        </div>
      </section>

      {/* Legends Stats */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-white flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6">
                <Star className="w-8 h-8 fill-current" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[#86868b] mb-2">Pluricampione</h3>
              <p className="text-3xl font-black text-[#1d1d1f]">Pietro Noli</p>
              <p className="text-blue-600 font-bold mt-1">3 Titoli Vinti</p>
            </div>
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-white flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[#86868b] mb-2">Partecipanti Totali</h3>
              <p className="text-3xl font-black text-[#1d1d1f]">Oltre 50</p>
              <p className="text-blue-600 font-bold mt-1">Atleti Storici</p>
            </div>
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-white flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-500 mb-6">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[#86868b] mb-2">Anni di Storia</h3>
              <p className="text-3xl font-black text-[#1d1d1f]">Dal 2018</p>
              <p className="text-blue-600 font-bold mt-1">6 Edizioni</p>
            </div>
          </div>
        </div>
      </section>

      {/* Editions List */}
      <section className="pb-40 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          {EDITIONS.map((edition) => (
            <div key={edition.id} className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-zinc-200/50 border border-white relative overflow-hidden group">
              {/* Sfondo decorativo soft */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative z-10">
                {/* Header Edizione */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                        {edition.title}
                      </span>
                      <span className="text-sm font-bold text-zinc-400">
                        {edition.date}
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#1d1d1f] tracking-tight">
                      NOLImpiadi <span className="text-blue-600 italic">{edition.date.split(' ').pop()}</span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Campione in carica</p>
                      <p className="text-xl font-black text-[#1d1d1f]">{edition.results[0].name}</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-200">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Podio e Classifica Generale (7 colonne) */}
                  <div className="lg:col-span-7 space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                      <div className="w-8 h-[2px] bg-blue-600/20" />
                      Classifica Generale
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Oro */}
                      <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                        <p className="text-[10px] font-black text-amber-600 uppercase mb-3">1° Posto</p>
                        <p className="text-lg font-black text-zinc-900 leading-tight">{edition.results[0].name}</p>
                      </div>
                      {/* Argento */}
                      <div className="bg-gradient-to-br from-zinc-50 to-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-3">2° Posto</p>
                        <p className="text-lg font-black text-zinc-900 leading-tight">{edition.results[1].name}</p>
                      </div>
                      {/* Bronzo */}
                      <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-3xl border border-orange-100 shadow-sm">
                        <p className="text-[10px] font-black text-orange-600 uppercase mb-3">3° Posto</p>
                        <p className="text-lg font-black text-zinc-900 leading-tight">{edition.results[2].name}</p>
                      </div>
                    </div>

                    <div className="bg-zinc-50/50 rounded-[2rem] p-6 border border-zinc-100">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                        {edition.results.slice(3).map((res) => (
                          <div key={res.pos} className="flex items-center justify-between py-2 border-b border-zinc-200/50 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-zinc-400 w-6">{res.pos}°</span>
                              <span className="text-sm font-bold text-zinc-600">{res.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Classifiche Discipline (5 colonne) */}
                  <div className="lg:col-span-5 space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-2">
                      <div className="w-8 h-[2px] bg-amber-600/20" />
                      Vincitori Discipline
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {edition.disciplines.map((disc, dIdx) => (
                        <div key={dIdx} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                          <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                            <disc.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{disc.name}</p>
                            <p className="text-base font-black text-zinc-900">{disc.winner}</p>
                          </div>
                          <div className="px-3 py-1 bg-amber-50 rounded-lg">
                            <Medal className="w-4 h-4 text-amber-500" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-blue-600 rounded-[2.5rem] text-white relative overflow-hidden group/cta">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                      <p className="text-sm font-bold mb-4 relative z-10 italic">
                        &quot;Ogni disciplina è una battaglia, <br />ogni vittoria è leggenda.&quot;
                      </p>
                      <Link href="/gare" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white text-blue-600 px-4 py-2 rounded-xl hover:scale-105 transition-transform">
                        Vedi Gare 2026 <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-zinc-900 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8">Vuoi entrare nella storia?</h2>
          <p className="text-xl text-zinc-400 font-medium mb-12">
            La prossima edizione è alle porte. Preparati per le NOLImpiadi 2026.
          </p>
          <Link href="/gare" className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 rounded-full text-white font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20">
            SCOPRI LE DISCIPLINE
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
