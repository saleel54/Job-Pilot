'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function AboutPage() {
  const supabase = createClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check login state
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    }
    checkUser();

    // Check active theme
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, [supabase]);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
    window.dispatchEvent(new Event('theme-change'));
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary transition-colors duration-200 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="border-b border-border-base bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center">
              {/* Dynamic Theme Aware Logo */}
              <img src="/logo-light.png" alt="JobPilot AI Logo" className="h-16 w-auto block dark:hidden" />
              <img src="/logo-dark.png" alt="JobPilot AI Logo" className="h-16 w-auto hidden dark:block" />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 bg-bg-elevated border border-border-base rounded text-xs font-bold uppercase tracking-wider font-mono hover:border-border-highlight transition-all"
            >
              {theme}
            </button>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-1.5 bg-accent-primary hover:bg-accent-primary/90 text-white rounded text-xs font-bold transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth"
                  className="px-4 py-1.5 bg-accent-primary hover:bg-accent-primary/90 text-white rounded text-xs font-bold transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16 md:py-24 space-y-16">
        
        {/* Intro Banner */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-primary px-3 py-1 bg-accent-glow border border-accent-primary/20 rounded-full">
            Meet the Team
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            About Us
          </h1>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            Discover the mission behind JobPilot AI and YAStudio&apos;s vision for career automation in tech.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Creator Profile Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-bg-surface border border-border-base p-8 rounded-2xl relative overflow-hidden group hover:border-border-highlight transition-all duration-300 shadow-sm">
              {/* Decorative top gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary via-indigo-400 to-accent-primary"></div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative w-36 h-36 rounded-full overflow-hidden ring-4 ring-accent-primary/10 group-hover:ring-accent-primary/30 transition-all duration-300">
                  <img 
                    src="/profile.png" 
                    alt="Yoosuf Ali Saleel" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-text-primary tracking-tight">Yoosuf Ali Saleel</h3>
                  <p className="text-xs font-bold text-accent-primary uppercase tracking-widest">Full Stack Developer</p>
                  <p className="text-[11px] text-text-secondary font-semibold">AI Product Builder</p>
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  <span className="px-2.5 py-1 rounded bg-bg-elevated border border-border-base text-[10px] font-bold text-text-secondary">
                    Next.js
                  </span>
                  <span className="px-2.5 py-1 rounded bg-bg-elevated border border-border-base text-[10px] font-bold text-text-secondary">
                    TypeScript
                  </span>
                  <span className="px-2.5 py-1 rounded bg-bg-elevated border border-border-base text-[10px] font-bold text-text-secondary">
                    AI Integrations
                  </span>
                  <span className="px-2.5 py-1 rounded bg-accent-glow border border-accent-primary/20 text-[10px] font-bold text-accent-primary">
                    YAStudio Founder
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-6 text-text-secondary text-sm md:text-base leading-relaxed text-left">
              <p>
                <strong className="text-text-primary font-bold">JobPilot AI</strong> was created to address one of the biggest challenges faced by job seekers today: navigating an increasingly competitive job market. The platform combines AI-powered job discovery, resume intelligence, application tracking, interview preparation, and career insights into a unified ecosystem designed to help candidates make smarter career decisions.
              </p>
              
              <p>
                As a student passionate about building impactful technology products, <strong className="text-text-primary font-semibold">Yoosuf Ali Saleel</strong> has developed multiple AI-powered applications focused on solving real-world problems in recruitment, career growth, and productivity. His work combines modern web technologies, artificial intelligence, cloud infrastructure, and user-centric design to create products that deliver meaningful value.
              </p>
            </div>

            {/* YAStudio Showcase */}
            <div className="bg-bg-surface border border-border-base p-6 rounded-xl flex flex-col md:flex-row gap-6 items-center md:items-start hover:border-border-highlight transition-colors duration-300">
              <div className="w-16 h-16 rounded-xl bg-bg-elevated border border-border-base flex items-center justify-center shrink-0 p-2 overflow-hidden shadow-inner">
                <img 
                  src="/yastudio.png" 
                  alt="YAStudio Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2 text-center md:text-left">
                <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">YAStudio</h4>
                <p className="text-text-secondary text-xs leading-relaxed">
                  YAStudio is an independent software studio dedicated to building innovative digital products powered by AI and modern technology. Founded with a vision to transform ideas into practical solutions, YAStudio focuses on creating applications that help individuals and businesses work smarter, grow faster, and achieve better outcomes.
                </p>
              </div>
            </div>

            <p className="text-text-secondary text-xs md:text-sm leading-relaxed italic border-l-2 border-accent-primary pl-4 py-1">
              &quot;At YAStudio, we believe technology should be accessible, impactful, and focused on solving real problems. JobPilot AI represents our commitment to building products that empower people and unlock new opportunities through innovation.&quot;
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-base py-10 bg-bg-surface text-text-secondary text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 JobPilot AI. Built by YAStudio for developers in India.</p>
          <div className="flex gap-6 font-semibold">
            <Link href="/" className="hover:text-text-primary">Home</Link>
            <a href="#" className="hover:text-text-primary">Privacy</a>
            <a href="#" className="hover:text-text-primary">Terms</a>
            <a href="#" className="hover:text-text-primary">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
