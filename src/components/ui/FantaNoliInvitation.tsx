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
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles className="w-24 h-24 text-blue-600 rotate-12" />
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-center">
          {/* Text Content */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-xs font-black uppercase tracking-wider">
              <Users size={14} />
              <span>Chiamata alle Armi per ex Atleti</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1d1d1f] leading-tight">
              Ehi, <span className="text-blue-600 italic">Ammico</span> Atleta! 🏟️
            </h2>
            
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
                <span>Gioca con Noi!</span>
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </a>

              <a 
                href="/documenti/regolamento-fanta.pdf"
                target="_blank"
                className="flex items-center gap-3 px-6 py-4 bg-white text-zinc-600 rounded-2xl font-bold border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-300"
              >
                <Users className="w-5 h-5 text-zinc-400" />
                <span>Leggi il Regolamento</span>
              </a>
              
              <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                <QrCode className="w-5 h-5 text-zinc-400" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Scansiona per i pronostici</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="relative group/qr">
            <div className="absolute -inset-4 bg-blue-100/50 rounded-[40px] blur-2xl opacity-0 group-hover/qr:opacity-100 transition-opacity duration-500" />
            <div className="relative p-4 bg-white rounded-[2.5rem] shadow-xl border border-zinc-100 rotate-[2deg] group-hover:rotate-0 transition-transform duration-500">
              <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-2xl overflow-hidden bg-zinc-50 flex items-center justify-center p-2 border-2 border-dashed border-blue-100">
                <img 
                  src={qrUrl} 
                  alt="QR Code FantaNolimpiadi" 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white p-3 rounded-2xl shadow-lg rotate-[-10deg] scale-0 group-hover:scale-100 transition-transform delay-200">
                <Sparkles size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FantaNoliInvitation;
