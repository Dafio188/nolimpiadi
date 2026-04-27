"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChefHat, UtensilsCrossed, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

const menuSections = [
  {
    id: "antipasti",
    emoji: "🍲",
    title: "Antipasti dell'Incomprensione",
    color: "from-red-400 to-orange-400",
    bgLight: "bg-red-50",
    border: "border-red-100",
    dishes: [
      {
        name: "Brodo alla Griglia™",
        desc: "Un brodo abbrustolito all'esterno e liquido all'interno, servito tiepido per errore in tazza solenne, priva di manico — per aumentare il rischio sensoriale.",
        badge: "Il piatto simbolo",
      },
      {
        name: "Crostino di Aria Fritta",
        desc: "Preparato con i profumi raccolti durante la cottura dei piatti veri. Nutriente per lo spirito, inutile per il resto. «Sa di casa… quando nessuno sta cucinando.»",
        badge: "Light",
      },
    ],
  },
  {
    id: "primi",
    emoji: "🍝",
    title: "Primi Concettuali",
    color: "from-yellow-400 to-amber-400",
    bgLight: "bg-yellow-50",
    border: "border-yellow-100",
    dishes: [
      {
        name: "Pasta Cruda Mantecata",
        desc: "Mantecata con grande convinzione prima di essere cotta. Pronta emotivamente, ma non gastronomicamente. Un vero portento.",
        badge: "Signature",
      },
      {
        name: "Vellutata Croccante",
        desc: "Morbida come un abbraccio… croccante come una decisione sbagliata. Il cucchiaio affonda, i denti vengono messi duramente alla prova.",
      },
      {
        name: "Zuppa Solida",
        desc: "Una zuppa che rifiuta lo stato liquido. Non scorre. Non reagisce. Solo ti guarda.",
        badge: "Filosofica",
      },
    ],
  },
  {
    id: "secondi",
    emoji: "🥩",
    title: "Secondi Improbabili",
    color: "from-emerald-400 to-teal-400",
    bgLight: "bg-emerald-50",
    border: "border-emerald-100",
    dishes: [
      {
        name: "Pollo Vegetariano",
        desc: "Non chiedete come. Non chiedete perché. Chiedete solo il bis (che non arriverà).",
        badge: "Misterioso",
      },
      {
        name: "Formaggio Liquido a Fette",
        desc: "Un paradosso caseario. Tagliato a fette con cura, ma colante per definizione. Ogni boccone è una sfida alle leggi fisiche.",
      },
      {
        name: "Uovo Scomposto ma Ancora nel Guscio",
        desc: "Tutte le componenti sono state separate, rimescolate e poi riconsegnate al guscio. Il sapere umano non è ancora pronto per comprenderlo.",
        badge: "⚠️ Avanzato",
      },
    ],
  },
  {
    id: "contorni",
    emoji: "🥗",
    title: "Contorni Paradossali",
    color: "from-lime-400 to-green-400",
    bgLight: "bg-lime-50",
    border: "border-lime-100",
    dishes: [
      {
        name: "Verdure Saltate a Freddo",
        desc: "Energicamente saltate… senza mai scaldarsi. Croccanti per caso, tiepide per errore. Consigliate a chi ama l'azione ma detesta il risultato.",
      },
      {
        name: "Contorno di Niente con Doppio Sale",
        desc: "Minimalista, quasi zen. Privo di materia, ma insolitamente sapido. «Sa di poco.» «Sì, ma con carattere.»",
        badge: "Zen",
      },
      {
        name: "Foglie Ripassate nel Loro Concetto",
        desc: "Ripassate brevemente nell'idea stessa di essere contorno. Non hanno bisogno di cottura: sono già state comprese.",
      },
    ],
  },
  {
    id: "dolci",
    emoji: "🎂",
    title: "Dolci Nolimpici",
    color: "from-pink-400 to-rose-400",
    bgLight: "bg-pink-50",
    border: "border-pink-100",
    dishes: [
      {
        name: "Semifreddo Caldo Ghiacciato",
        desc: "Nasce semifreddo, viene servito caldo, risulta tiepido e ghiacciato al tempo stesso. «Stava per essere buono, ma poi ha cambiato idea.»",
        badge: "Premio Contraddizione",
      },
      {
        name: "Ciambella Chiusa",
        desc: "Perfettamente chiusa, con crisi di identità continue. La si mangia senza che lei sappia veramente chi è.",
      },
      {
        name: "Tiramisù Definitivamente Giù",
        desc: "Arriva al tavolo già sconfitto. Non tira su nessuno, non solleva spiriti. Sorprendentemente coerente con l'umore post-aperitivo Nolimpico di chi ha perso tutte le partite.",
        badge: "Per i perdenti 🏳️",
      },
    ],
  },
];

interface MenuNolimpicoCardProps {
  pdfUrl?: string;
}

export default function MenuNolimpicoCard({ pdfUrl }: MenuNolimpicoCardProps) {
  const [openSection, setOpenSection] = useState<string | null>("antipasti");

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.15 }}
      className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-amber-200/60 shadow-2xl shadow-amber-200/30"
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-orange-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 p-8 lg:p-10">

        {/* Header con mascot su entrambi i lati */}
        <div className="flex flex-row items-center gap-4 mb-8">
          {/* Mascot SINISTRA — si lecca i baffi */}
          <div className="hidden sm:flex flex-shrink-0 w-28 lg:w-36 self-end">
            <img
              src="/immagini/mascot/Chef Nolimpius che si lecca i baffi.png"
              alt="Chef Nolimpius soddisfatto"
              className="w-full h-auto object-contain"
              style={{
                filter: "drop-shadow(0 12px 24px rgba(251,146,60,0.3))",
                animation: "floatChefL 3.2s ease-in-out infinite",
              }}
            />
          </div>

          {/* Contenuto CENTRALE */}
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="bg-amber-500 p-1.5 rounded-lg shadow-md shadow-amber-500/30">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                Chef Nolimpius presenta
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-[#1d1d1f] tracking-tight leading-none mb-2">
              Menù <span className="text-amber-500 italic">Nolimpico</span>
            </h2>
            <p className="text-sm text-zinc-500 font-medium max-w-lg mx-auto">
              L&apos;aperitivo ufficiale più paradossale del multiverso sportivo. Ogni piatto è un&apos;esperienza esistenziale.
            </p>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] transition-all"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Vedi Menù Completo
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}
          </div>

          {/* Mascot DESTRA — con il MENU in mano */}
          <div className="hidden sm:flex flex-shrink-0 w-28 lg:w-36 self-end">
            <img
              src="/immagini/mascot/Chef Nolimpius nobg.png"
              alt="Chef Nolimpius con il Menù"
              className="w-full h-auto object-contain scale-x-[-1]"
              style={{
                filter: "drop-shadow(0 12px 24px rgba(251,146,60,0.3))",
                animation: "floatChefR 3.5s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Accordion Sezioni */}
        <div className="space-y-3">
          {menuSections.map((section, sIdx) => {
            const isOpen = openSection === section.id;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + sIdx * 0.06 }}
                className="overflow-hidden rounded-2xl border border-white/80 bg-white/60 backdrop-blur-sm shadow-sm"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br ${section.color} text-white text-base shadow-sm`}>
                      {section.emoji}
                    </span>
                    <span className="font-black text-[#1d1d1f] text-base">{section.title}</span>
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                      {section.dishes.length} piatti
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  )}
                </button>

                {/* Accordion Body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className={`px-5 pb-5 pt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${section.bgLight} rounded-b-2xl`}>
                        {section.dishes.map((dish) => (
                          <div
                            key={dish.name}
                            className={`bg-white/80 rounded-xl p-4 border ${section.border} hover:shadow-md transition-shadow`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="font-black text-[#1d1d1f] text-sm leading-tight">{dish.name}</span>
                              {dish.badge && (
                                <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  {dish.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed italic">{dish.desc}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" />

      <style>{`
        @keyframes floatChefL {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(0deg); }
        }
        @keyframes floatChefR {
          0%, 100% { transform: translateY(-4px) rotate(2deg) scaleX(-1); }
          50% { transform: translateY(4px) rotate(0deg) scaleX(-1); }
        }
      `}</style>
    </motion.section>
  );
}
