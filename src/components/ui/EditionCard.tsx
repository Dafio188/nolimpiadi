"use client";

import React from "react";
import { Trophy, Medal, ArrowRight } from "lucide-react";

export default function EditionCard({ edition }: { edition: any }) {
  // Lo stato del tab attivo per le discipline
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-zinc-200/50 border border-white relative overflow-hidden group">
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
          {/* Podio e Classifica Generale (6 colonne) */}
          <div className="lg:col-span-6 space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-blue-600/20" />
              Classifica Generale
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Oro */}
              <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden">
                <div className="absolute -right-2 -top-2 opacity-10">
                   <Trophy className="w-12 h-12 text-amber-600" />
                </div>
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
                {edition.results.slice(3).map((res: any) => (
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

          {/* Classifiche Discipline (6 colonne) */}
          <div className="lg:col-span-6 space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-amber-600/20" />
              Classifiche Discipline
            </h3>
            
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden flex flex-col h-full">
              {/* Tab Selector */}
              <div className="flex border-b border-zinc-100 bg-zinc-50/50">
                {edition.disciplines.map((disc: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all relative ${activeTab === idx ? 'bg-white' : 'hover:bg-zinc-100/50'}`}
                  >
                    <disc.icon className={`w-5 h-5 ${activeTab === idx ? 'text-blue-600' : 'text-zinc-400'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === idx ? 'text-blue-600' : 'text-zinc-400'}`}>
                      {disc.name.split(' ')[0]}
                    </span>
                    {activeTab === idx && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                      {React.createElement(edition.disciplines[activeTab].icon, { className: "w-6 h-6" })}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-zinc-900 leading-tight uppercase tracking-tighter">
                        {edition.disciplines[activeTab].name}
                      </h4>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Podio e Classifica</p>
                    </div>
                  </div>
                  <Medal className="w-8 h-8 text-amber-400" />
                </div>

                {/* Ranking List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                  {/* Vincitore evidenziato */}
                  <div className="col-span-full mb-2 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-white font-black shadow-lg shadow-amber-200">1°</div>
                      <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Vincitore</p>
                        <p className="text-lg font-black text-zinc-900">{edition.disciplines[activeTab].winner}</p>
                      </div>
                    </div>
                    <Medal className="w-6 h-6 text-amber-500" />
                  </div>

                  {/* Altri atleti (fallback coerente) */}
                  {edition.results.slice(1).map((res: any, rIdx: number) => (
                    <div key={res.pos} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0 sm:last:border-b">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-400 w-6">{rIdx + 2}°</span>
                        <span className="text-sm font-bold text-zinc-600">{res.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
