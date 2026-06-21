'use client';

import React from 'react';
import { 
  FileCheck, 
  ShieldCheck, 
  Code, 
  Briefcase, 
  Users 
} from 'lucide-react';

interface CareerCommandCenterProps {
  profileImage?: string;
  userName?: string;
}

export default function CareerCommandCenter({ 
  profileImage = '/profile.png',
  userName = 'Saleel' 
}: CareerCommandCenterProps) {
  const nodes = [
    {
      label: 'Resume Vault',
      icon: FileCheck,
      color: 'text-emerald-700 border-emerald-500/20 bg-white/95',
      glow: 'shadow-emerald-500/5',
      orbit: 'animate-[orbit-inner_25s_infinite_linear]',
      delay: '-0s',
    },
    {
      label: 'ATS Check: 95%',
      icon: ShieldCheck,
      color: 'text-emerald-600 border-emerald-500/20 bg-white/95',
      glow: 'shadow-emerald-500/5',
      orbit: 'animate-[orbit-inner_25s_infinite_linear]',
      delay: '-12.5s',
    },
    {
      label: 'Skills Stack',
      icon: Code,
      color: 'text-emerald-600 border-emerald-500/20 bg-white/95',
      glow: 'shadow-emerald-500/5',
      orbit: 'animate-[orbit-middle_35s_infinite_linear]',
      delay: '-5s',
    },
    {
      label: '43 Match Alerts',
      icon: Briefcase,
      color: 'text-emerald-700 border-emerald-500/20 bg-white/95',
      glow: 'shadow-emerald-500/5',
      orbit: 'animate-[orbit-middle_35s_infinite_linear]',
      delay: '-22s',
    },
    {
      label: 'Interviews Ready',
      icon: Users,
      color: 'text-amber-700 border-amber-500/20 bg-white/95',
      glow: 'shadow-amber-500/5',
      orbit: 'animate-[orbit-outer_45s_infinite_linear]',
      delay: '-15s',
    },
  ];

  return (
    <div className="relative w-[340px] h-[340px] md:w-[480px] md:h-[480px] flex items-center justify-center select-none overflow-visible z-10">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes orbit-inner {
          0% { transform: rotate(0deg) translateY(-85px) rotate(0deg); }
          100% { transform: rotate(360deg) translateY(-85px) rotate(-360deg); }
        }
        @keyframes orbit-middle {
          0% { transform: rotate(0deg) translateY(-145px) rotate(0deg); }
          100% { transform: rotate(360deg) translateY(-145px) rotate(-360deg); }
        }
        @keyframes orbit-outer {
          0% { transform: rotate(0deg) translateY(-205px) rotate(0deg); }
          100% { transform: rotate(360deg) translateY(-205px) rotate(-360deg); }
        }
        @media (max-width: 768px) {
          @keyframes orbit-inner {
            0% { transform: rotate(0deg) translateY(-60px) rotate(0deg); }
            100% { transform: rotate(360deg) translateY(-60px) rotate(-360deg); }
          }
          @keyframes orbit-middle {
            0% { transform: rotate(0deg) translateY(-100px) rotate(0deg); }
            100% { transform: rotate(360deg) translateY(-100px) rotate(-360deg); }
          }
          @keyframes orbit-outer {
            0% { transform: rotate(0deg) translateY(-140px) rotate(0deg); }
            100% { transform: rotate(360deg) translateY(-140px) rotate(-360deg); }
          }
        }
      `}} />

      {/* Orbit Rings Background */}
      <div className="absolute w-[170px] h-[170px] md:w-[170px] md:h-[170px] border border-slate-200/80 rounded-full pointer-events-none z-0"></div>
      <div className="absolute w-[170px] h-[170px] md:w-[170px] md:h-[170px] border border-[#00D67A]/15 rounded-full blur-[2px] pointer-events-none z-0"></div>
      
      <div className="absolute w-[120px] h-[120px] md:w-[170px] md:h-[170px] border border-slate-200/80 rounded-full pointer-events-none z-0 scale-75 md:scale-100"></div>
      <div className="absolute w-[200px] h-[200px] md:w-[290px] md:h-[290px] border border-slate-200/80 rounded-full pointer-events-none z-0 scale-75 md:scale-100 border-dashed"></div>
      <div className="absolute w-[280px] h-[280px] md:w-[410px] md:h-[410px] border border-slate-200/80 rounded-full pointer-events-none z-0 scale-75 md:scale-100"></div>

      {/* Sphere Halo Lights */}
      <div className="absolute w-28 h-28 md:w-36 md:h-36 rounded-full bg-[#00D67A]/8 blur-xl animate-pulse pointer-events-none"></div>
      <div className="absolute w-20 h-20 md:w-28 md:h-28 rounded-full bg-[#7CFFB2]/4 blur-lg animate-pulse pointer-events-none delay-1000"></div>

      {/* Central Glass Sphere / Profile DNA */}
      <div className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full backdrop-blur-xl bg-white/80 border border-slate-200/80 flex items-center justify-center shadow-xl z-20 overflow-visible group">
        <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-[#00D67A]/30">
          <img 
            src={profileImage} 
            alt={userName} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            onError={(e) => {
              e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Saleel';
            }}
          />
        </div>
        {/* Pulse Ring */}
        <div className="absolute -inset-1 rounded-full border border-[#00D67A]/40 animate-ping opacity-25 pointer-events-none"></div>
      </div>


      {/* Orbiting Nodes */}
      {nodes.map((node, i) => {
        const Icon = node.icon;
        return (
          <div
            key={i}
            className={`absolute flex items-center justify-center z-30 cursor-pointer ${node.orbit} hover:[animation-play-state:paused]`}
            style={{ 
              animationDelay: node.delay,
            }}
          >
            <div className={`flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3.5 md:py-1.5 rounded-full border backdrop-blur-md text-[9px] md:text-[11px] font-bold tracking-wide transition-all duration-300 hover:scale-110 shadow-lg ${node.color} ${node.glow} hover:bg-slate-50 hover:border-slate-350 hover:text-slate-900`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{node.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
