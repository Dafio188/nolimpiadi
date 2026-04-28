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


        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Text Content */}
          <div className="flex-1 space-y-6 relative z-10">
            {/* Banner integrato nel riquadro come richiesto */}
            <div className="mb-8 flex justify-center lg:justify-start">
              <img 
                src="/immagini/Scritta%20con%20logo%20e%20mascot.jpeg" 
                alt="FantaNolimpiadi Banner" 
                className="h-16 md:h-20 object-contain drop-shadow-lg"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1d1d1f] leading-tight">
                Gioca e Vinci<br />
                alle FantaNolimpiadi 2026!
              </h2>
            </div>
            
            <p className="text-lg text-[#86868b] font-medium leading-relaxed max-w-xl">
              Hai ancora quel fuoco sacro (o è solo un leggero bruciore di stomaco)? Le vecchie glorie non muoiono mai, si trasferiscono solo alle <span className="text-zinc-900 font-bold underline decoration-blue-500/30">FantaNolimpiadi 2026</span>. 
              <br /><br />
              Non importa se il tuo unico sport ormai è il sollevamento forchetta: torna in pista e dimostra agli sbarbatelli come si vince con stile!
            </p>

            <div className="flex flex-wrap gap-4 items-center pt-4">
              <a 
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <span>Gioca alle FantaNolimpiadi!</span>
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </a>

              <a 
                href="/documenti/regolamento-fanta.pdf"
                target="_blank"
                className="flex items-center gap-3 px-6 py-4 bg-amber-400 text-zinc-900 rounded-2xl font-bold border border-amber-500 shadow-lg shadow-amber-200/50 hover:bg-amber-500 hover:shadow-xl transition-all duration-300"
              >
                <Users className="w-5 h-5 text-zinc-900/50" />
                <span>Leggi il Regolamento</span>
              </a>
            </div>
          </div>

          {/* Main Logo Image - Moved from background to right side */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
            <div className="w-[300px] h-[300px] relative">
              <div className="absolute -inset-4 bg-blue-50 rounded-full blur-3xl opacity-50" />
              <img 
                src="/immagini/logo_con%20la%20mascot.jpeg" 
                alt="Logo FantaNolimpiadi" 
                className="relative w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FantaNoliInvitation;
