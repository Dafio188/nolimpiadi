"use client";

import { motion } from "framer-motion";

const FantaNoliBanner = () => {
  return (
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
  );
};

export default FantaNoliBanner;
