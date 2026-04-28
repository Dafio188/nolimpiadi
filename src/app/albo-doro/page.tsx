import { Trophy, Medal, Star, Calendar, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const EDITIONS = [
  {
    id: 6,
    title: "6° Edizione",
    date: "23 giugno 2024",
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
    ]
  },
  {
    id: 5,
    title: "5° Edizione",
    date: "18 giugno 2023",
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
    ]
  },
  {
    id: 4,
    title: "4° Edizione",
    date: "7 aprile 2019",
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
    ]
  },
  {
    id: 3,
    title: "3° Edizione",
    date: "21 ottobre 2018",
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
    ]
  },
  {
    id: 2,
    title: "2° Edizione",
    date: "1 luglio 2018",
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
    ]
  },
  {
    id: 1,
    title: "1° Edizione",
    date: "4 marzo 2018",
    results: [
      { pos: 1, name: "Pietro Noli" },
      { pos: 2, name: "Gianni Teti" },
      { pos: 3, name: "Massimo Robutti" },
      { pos: 4, name: "Stefano Bisoglio" },
      { pos: 5, name: "Valeriano Seminara / Doris" },
      { pos: 6, name: "Andrea Spada" },
      { pos: 7, name: "Vito Albanese" },
      { pos: 8, name: "Sergio Piazza / Mirella Boffano" },
      { pos: 9, name: "Flavio Barresi / Caterina Mamone" },
      { pos: 10, name: "Aurelio Piccione" },
      { pos: 11, name: "Patrizia Interliggi" },
      { pos: 12, name: "Matheus Interliggi" },
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
      <section className="pt-20 pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 mb-8">
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Hall of Fame</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-[#1d1d1f] tracking-tight mb-8">
            Albo d'Oro <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">NOLImpiadi</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#86868b] font-medium max-w-3xl mx-auto">
            La storia, i campioni e le leggende che hanno reso indimenticabile ogni singola edizione.
          </p>
        </div>
      </section>

      {/* Legends Stats */}
      <section className="pb-32 px-6">
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
        <div className="max-w-4xl mx-auto space-y-24">
          {EDITIONS.map((edition, index) => (
            <div key={edition.id} className="relative group">
              {/* Year Badge */}
              <div className="absolute -left-4 md:-left-12 top-0 bottom-0 w-px bg-gradient-to-b from-blue-600/20 via-transparent to-transparent hidden md:block" />
              
              <div className="flex flex-col gap-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#1d1d1f] mb-2">{edition.title}</h2>
                    <p className="text-xl text-blue-600 font-bold">{edition.date}</p>
                  </div>
                  <div className="px-6 py-2 bg-white rounded-2xl border border-zinc-100 shadow-sm text-sm font-bold text-[#86868b]">
                    Podio Ufficiale
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Winner */}
                  <div className="bg-white rounded-[32px] p-8 shadow-md border border-amber-100 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                    <div className="absolute top-0 right-0 p-4">
                      <Trophy className="w-8 h-8 text-amber-400" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-2">1° POSTO</p>
                    <p className="text-2xl font-black text-[#1d1d1f] leading-tight">{edition.results[0].name}</p>
                  </div>

                  {/* 2nd Place */}
                  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 relative group-hover:scale-[1.02] transition-transform duration-500 delay-75">
                    <div className="absolute top-0 right-0 p-4">
                      <Medal className="w-8 h-8 text-zinc-300" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">2° POSTO</p>
                    <p className="text-xl font-black text-[#1d1d1f] leading-tight">{edition.results[1].name}</p>
                  </div>

                  {/* 3rd Place */}
                  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 relative group-hover:scale-[1.02] transition-transform duration-500 delay-150">
                    <div className="absolute top-0 right-0 p-4">
                      <Medal className="w-8 h-8 text-orange-300" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-orange-400 mb-2">3° POSTO</p>
                    <p className="text-xl font-black text-[#1d1d1f] leading-tight">{edition.results[2].name}</p>
                  </div>
                </div>

                {/* Full Ranking Accordion / List */}
                <div className="bg-white/50 backdrop-blur-sm rounded-[32px] p-8 border border-white/50">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#86868b] mb-6">Classifica Completa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-12">
                    {edition.results.slice(3).map((res) => (
                      <div key={res.pos} className="flex items-center justify-between py-2 border-b border-zinc-100/50">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-blue-600 w-6">{res.pos}°</span>
                          <span className="text-sm font-bold text-[#1d1d1f]">{res.name}</span>
                        </div>
                      </div>
                    ))}
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
