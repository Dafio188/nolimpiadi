"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Users, ArrowRight, Sparkles } from 'lucide-react';

interface FantaNoliInvitationProps {
  formUrl: string;
}

const FantaNoliInvitation = ({ formUrl }: FantaNoliInvitationProps) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formUrl)}&color=2563eb&bgcolor=ffffff`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
    >
      {/* Glow Effect Background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-amber-400 rounded-[36px] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      
      <div className="relative bg-white/80 backdrop-blur-3xl border border-white/50 rounded-[32px] p-8 lg:p-10 shadow-2xl overflow-hidden">
        {/* Decorative elements - High visibility mascot in the background */}


        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-center">
          {/* Left Column: Veggente (Oracolo) + Text */}
          <div className="flex-1 flex flex-col items-center gap-6 relative z-10">
            {/* Veggente Centered Above Text */}
            <div className="w-full flex justify-center">
              <img 
                src="/immagini/mascot/mascot_oracolo.jpeg" 
                alt="FantaNolimpiadi Oracolo" 
                className="h-32 md:h-40 object-contain rounded-full shadow-2xl border-4 border-white ring-4 ring-blue-500/10"
              />
            </div>
            
            <div className="space-y-4 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1d1d1f] leading-tight">
                Gioca e Vinci<br />
                alle FantaNolimpiadi 2026!
              </h2>
              <p className="text-lg text-[#86868b] font-medium leading-relaxed max-w-xl mx-auto">
                Hai ancora quel fuoco sacro? Le vecchie glorie non muoiono mai, si trasferiscono solo alle <span className="text-zinc-900 font-bold underline decoration-blue-500/30">FantaNolimpiadi 2026</span>.
              </p>
            </div>
          </div>

          {/* Right Column: New Fanta-Expert + Buttons Stack */}
          <div className="w-full lg:w-[450px] flex flex-col items-center gap-6">
            {/* New Custom Fanta Mascot - ENLARGED with multiply blend */}
            <div className="relative w-full aspect-square max-w-[320px] lg:max-w-full">
              <div className="absolute inset-0 bg-amber-100/50 rounded-full blur-3xl" />
              <img 
                src="/immagini/mascot/nolimpius_fanta_expert.png" 
                alt="Nolimpius Fanta Expert" 
                className="relative w-full h-full object-contain rounded-full shadow-2xl border-4 border-white ring-4 ring-amber-500/10"
              />
            </div>

            {/* Vertically Stacked Buttons */}
            <div className="flex flex-col w-full gap-3 max-w-[300px]">
              <a 
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
              >
                <span>Gioca Ora!</span>
                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
              </a>

              <a 
                href="/documenti/regolamento-fanta.pdf"
                target="_blank"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-amber-400 text-zinc-900 rounded-2xl font-black border-2 border-amber-500 shadow-xl shadow-amber-200/50 hover:bg-amber-500 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
              >
                <span>Regolamento</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FantaNoliInvitation;
