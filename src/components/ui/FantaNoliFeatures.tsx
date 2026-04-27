"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react';

const features = [
  {
    icon: Target,
    title: "Scegli i Campioni",
    desc: "Indovina chi trionferà nelle 4 discipline ufficiali e accumula il tuo tesoretto.",
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    icon: TrendingUp,
    title: "Punteggio Real-Time",
    desc: "I tuoi punti variano in base alle prestazioni reali degli atleti in gara.",
    color: "text-amber-600",
    bg: "bg-amber-50"
  },
  {
    icon: Trophy,
    title: "Sfida tra Ex",
    desc: "Una classifica dedicata esclusivamente a voi, le leggende delle passate edizioni.",
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  {
    icon: Award,
    title: "Gloria Eterna",
    desc: "Oltre al rispetto eterno, premi speciali per i primi 3 classificati.",
    color: "text-green-600",
    bg: "bg-green-50"
  }
];

const FantaNoliFeatures = () => {
  return (
    <div className="space-y-12">
      {/* Official Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="flex justify-center"
      >
        <div className="relative group">
          <div className="absolute -inset-4 bg-blue-100 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-50 transition-opacity" />
          <img 
            src="/immagini/Scritta%20con%20logo%20e%20mascot.jpeg" 
            alt="FantaNolimpiadi Official Banner" 
            className="relative h-20 md:h-28 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="bg-white/50 backdrop-blur-xl border border-white/80 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow"
        >
          <div className={`w-12 h-12 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-4`}>
            <f.icon size={24} />
          </div>
          <h3 className="text-lg font-black text-[#1d1d1f] mb-2">{f.title}</h3>
          <p className="text-sm text-[#86868b] font-medium leading-relaxed">
            {f.desc}
          </p>
        </motion.div>
      ))}
      </div>
    </div>
  );
};

export default FantaNoliFeatures;
