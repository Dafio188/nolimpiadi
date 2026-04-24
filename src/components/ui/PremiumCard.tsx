import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PremiumCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  color?: string;
  children?: React.ReactNode;
  className?: string;
  delay?: number;
}

const PremiumCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color = "blue", 
  children, 
  className = "",
  delay = 0 
}: PremiumCardProps) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  if (children) {
    return (
      <div 
        className={`glass-panel rounded-[32px] overflow-hidden border border-white/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${className}`}
        style={{ animationDelay: `${delay}s` }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`glass-panel group relative p-8 rounded-[32px] transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer h-full flex flex-col gap-4 overflow-hidden border border-white/50 ${className}`}>
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${colorClasses[color]}`} />
      
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${colorClasses[color]}`}>
        {Icon && <Icon size={28} />}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">{title}</h3>
        <p className="text-[#86868b] leading-relaxed font-medium">
          {description}
        </p>
      </div>

      <div className="mt-auto flex items-center text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Esplora →
      </div>
    </div>
  );
};

export default PremiumCard;
