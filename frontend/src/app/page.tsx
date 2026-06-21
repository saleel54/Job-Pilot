'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Briefcase, FileCheck, KanbanSquare } from 'lucide-react';
import CareerCommandCenter from '@/components/CareerCommandCenter';

export default function LandingPage() {
  useEffect(() => {
    // Remove dark class when landing page is mounted so that it is always light theme
    const isDarkBefore = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    return () => {
      // Re-add dark class if it was there before, so other pages aren't affected
      if (isDarkBefore) {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  return (
    <div className="min-h-screen text-slate-900 bg-[#F8FAF8] relative overflow-hidden transition-colors duration-200">
      
      {/* Header / Navbar */}
      <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center">
              {/* Logo (Light theme by default for landing page) */}
              <img src="/logo-light.png" alt="JobPilot AI Logo" className="h-32 w-auto block" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </Link>
              <Link href="#about" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                About Us
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth"
              className="px-5 py-2 bg-gradient-to-r from-[#00D67A] to-[#00A65A] text-[#0A0F0C] rounded-xl text-sm font-bold shadow-lg hover:shadow-[0_10px_30px_rgba(0,214,122,0.35)] transition-all active:scale-[0.98] btn-magnetic"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-7 text-left space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-accent-primary/10 border border-accent-primary/25 text-accent-primary uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
            AI-Powered Career Automation
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl text-slate-900 font-heading">
            Your AI{' '}
            <span className="bg-gradient-to-r from-[#00D67A] via-[#7CFFB2] to-[#00A65A] bg-clip-text text-transparent">
              Career Copilot
            </span>
          </h1>

          <p className="text-slate-700 text-base md:text-lg max-w-xl leading-relaxed">
            Stop searching for jobs. Let AI find, analyze and optimize every opportunity for you. JobPilot AI parses your resume, matches you with developer roles, and tailors your profile.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-start items-center gap-4">
            <Link
              href="/auth"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#00D67A] to-[#00A65A] text-[#0A0F0C] font-bold rounded-xl text-sm shadow-xl hover:shadow-[0_10px_30px_rgba(0,214,122,0.35)] transition-all text-center btn-magnetic"
            >
              Launch Free AI Profile
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 border border-slate-300 text-slate-700 hover:text-slate-950 font-bold rounded-xl text-sm hover:bg-slate-100/60 transition-all text-center"
            >
              Explore Features
            </Link>
          </div>
        </div>

        {/* Orbiting Career Command Center */}
        <div className="lg:col-span-5 flex justify-center items-center overflow-visible py-4">
          <CareerCommandCenter />
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/80 relative z-10 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">Everything You Need To Stand Out</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">Maximize your interview callback rates using tailored workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card glow-card glass-shine card-hover-rise p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">Smart JD Match</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Instantly compare any job description with your developer profile to calculate fit, flag missing keywords, and suggest fixes.
            </p>
          </div>

          <div className="glass-card glow-card glass-shine card-hover-rise p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">Resume Tailoring</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Align your bullets and experiences with job keywords dynamically. Accept or reject changes side-by-side and download an A4 PDF.
            </p>
          </div>

          <div className="glass-card glow-card glass-shine card-hover-rise p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
              <KanbanSquare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">Applications Kanban</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Track progress through Saved, Applied, Interview, Offer, and Rejected. Set reminders to follow up on stagnating applications.
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-200/80 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
          
          {/* Left Column: Developer Profile Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card glow-card glass-shine card-hover-rise p-8 rounded-[32px] relative overflow-hidden group">
              {/* Profile image center */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative w-36 h-36 rounded-full overflow-hidden ring-4 ring-accent-primary/25 group-hover:ring-accent-primary/40 transition-all duration-300">
                  <img 
                    src="/profile.png" 
                    alt="Yoosuf Ali Saleel" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Saleel';
                    }}
                  />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight font-heading">Yoosuf Ali Saleel</h3>
                  <p className="text-xs font-semibold text-accent-primary uppercase tracking-widest">Full Stack Developer</p>
                  <p className="text-[10px] text-slate-500 font-semibold">AI Product Builder</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200/85 text-slate-600">
                    Next.js
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200/85 text-slate-600">
                    TypeScript
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200/85 text-slate-600">
                    AI/LLMs
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent-primary/10 border border-accent-primary/20 text-accent-primary">
                    YAStudio Founder
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio and Company Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-accent-primary">The Story Behind the Product</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-heading">About Us</h2>
            </div>

            <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
              <p>
                <strong className="text-slate-900">JobPilot AI</strong> was created to address one of the biggest challenges faced by job seekers today: navigating an increasingly competitive job market. The platform combines AI-powered job discovery, resume intelligence, application tracking, interview preparation, and career insights into a unified ecosystem designed to help candidates make smarter career decisions.
              </p>
              
              <p>
                As a student passionate about building impactful technology products, <strong className="text-slate-900">Yoosuf Ali Saleel</strong> has developed multiple AI-powered applications focused on solving real-world problems in recruitment, career growth, and productivity. His work combines modern web technologies, artificial intelligence, cloud infrastructure, and user-centric design to create products that deliver meaningful value.
              </p>
            </div>

            {/* Company Info Box */}
            <div className="glass-card glow-card glass-shine card-hover-rise p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 p-2 overflow-hidden shadow-sm">
                <img 
                  src="/yastudio.png" 
                  alt="YAStudio Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=yastudio';
                  }}
                />
              </div>
              <div className="space-y-2 text-center md:text-left">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-heading">YAStudio</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  YAStudio is an independent software studio dedicated to building innovative digital products powered by AI and modern technology. YAStudio focuses on creating applications that help individuals work smarter, grow faster, and achieve better outcomes.
                </p>
              </div>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed italic border-l-2 border-accent-primary/40 pl-4 py-1">
              &quot;At YAStudio, we believe technology should be accessible, impactful, and focused on solving real problems. JobPilot AI represents our commitment to building products that empower people and unlock new opportunities through innovation.&quot;
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-10 bg-white/40 text-slate-500 relative z-10 text-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 JobPilot AI. Built for developers in India.</p>
          <div className="flex gap-6 font-semibold">
            <Link href="#about" className="hover:text-slate-900">About Us</Link>
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Terms</a>
            <a href="#" className="hover:text-slate-900">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
