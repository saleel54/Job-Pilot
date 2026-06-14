'use client';

import Link from 'next/link';
import { Sparkles, Briefcase, FileCheck, KanbanSquare } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white selection:bg-indigo-500 selection:text-white relative overflow-hidden transition-colors duration-200">
      
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-100/40 dark:bg-indigo-900/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-50/50 dark:bg-indigo-950/20 blur-3xl pointer-events-none"></div>

      {/* Header / Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center">
              {/* Responsive Logo Theme Swapping */}
              <img src="/logo-light.png" alt="JobPilot AI Logo" className="h-20 w-auto block dark:hidden" />
              <img src="/logo-dark.png" alt="JobPilot AI Logo" className="h-20 w-auto hidden dark:block" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#about" className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                About Us
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-200/50 dark:shadow-indigo-900/30 transition-all active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-32 text-center relative z-10 space-y-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-900/50 dark:text-indigo-300 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          AI-Powered Career Automation
        </span>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto text-slate-900 dark:text-white">
          Land Your First Tech Role in India with{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600 dark:from-indigo-400 dark:via-indigo-200 dark:to-indigo-400 bg-clip-text text-transparent">
            AI Precision
          </span>
        </h1>

        <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          JobPilot AI parses your resume, matches you with developer opportunities, and tailors every application with keyword-optimized resumes, cover letters, and outreach.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/auth"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-base shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/40 transition-all active:scale-[0.98]"
          >
            Launch Free AI Profile
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-bold rounded-lg text-base hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-all"
          >
            Explore Features
          </Link>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200 dark:border-slate-800 relative z-10 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Everything You Need To Stand Out</h2>
          <p className="text-slate-600 dark:text-slate-450 text-sm max-w-md mx-auto">Maximize your interview callback rates using tailored workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-6 rounded-xl space-y-4 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-700/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart JD Match</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Instantly compare any job description with your developer profile to calculate fit, flag missing keywords, and suggest fixes.
            </p>
          </div>

          <div className="bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-6 rounded-xl space-y-4 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-700/50 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resume Tailoring</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Align your bullets and experiences with job keywords dynamically. Accept or reject changes side-by-side and download an A4 PDF.
            </p>
          </div>

          <div className="bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-6 rounded-xl space-y-4 shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-700/50 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <KanbanSquare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Applications Kanban</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Track progress through Saved, Applied, Interview, Offer, and Rejected. Set reminders to follow up on stagnating applications.
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-200 dark:border-slate-800 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
          
          {/* Left Column: Developer Profile Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 dark:bg-slate-950/60 dark:border-slate-800 p-8 rounded-2xl relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300 shadow-sm dark:shadow-none">
              {/* Background gradient glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-300"></div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative w-36 h-36 rounded-full overflow-hidden ring-4 ring-indigo-500/10 dark:ring-indigo-500/20 group-hover:ring-indigo-500/30 dark:group-hover:ring-indigo-500/40 transition-all duration-300">
                  <img 
                    src="/profile.png" 
                    alt="Yoosuf Ali Saleel" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Yoosuf Ali Saleel</h3>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Full Stack Developer</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">AI Product Builder</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350">
                    Next.js
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350">
                    TypeScript
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350">
                    AI/LLMs
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-900/50 dark:text-indigo-300">
                    YAStudio Founder
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio and Company Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">The Story Behind the Product</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">About Us</h2>
            </div>

            <div className="space-y-6 text-slate-600 dark:text-slate-350 text-sm leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">JobPilot AI</strong> was created to address one of the biggest challenges faced by job seekers today: navigating an increasingly competitive job market. The platform combines AI-powered job discovery, resume intelligence, application tracking, interview preparation, and career insights into a unified ecosystem designed to help candidates make smarter career decisions.
              </p>
              
              <p>
                As a student passionate about building impactful technology products, <strong className="text-slate-900 dark:text-white">Yoosuf Ali Saleel</strong> has developed multiple AI-powered applications focused on solving real-world problems in recruitment, career growth, and productivity. His work combines modern web technologies, artificial intelligence, cloud infrastructure, and user-centric design to create products that deliver meaningful value.
              </p>
            </div>

            {/* Company Info Box */}
            <div className="bg-slate-100/50 border border-slate-200 dark:bg-slate-950/40 dark:border-slate-800 p-6 rounded-xl flex flex-col md:flex-row gap-6 items-center md:items-start hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-300 shadow-sm">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-850 flex items-center justify-center shrink-0 p-2 overflow-hidden shadow-sm">
                <img 
                  src="/yastudio.png" 
                  alt="YAStudio Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2 text-center md:text-left">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">YAStudio</h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  YAStudio is an independent software studio dedicated to building innovative digital products powered by AI and modern technology. Founded with a vision to transform ideas into practical solutions, YAStudio focuses on creating applications that help individuals and businesses work smarter, grow faster, and achieve better outcomes.
                </p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed italic border-l-2 border-indigo-500/40 pl-4 py-1">
              &quot;At YAStudio, we believe technology should be accessible, impactful, and focused on solving real problems. JobPilot AI represents our commitment to building products that empower people and unlock new opportunities through innovation.&quot;
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 bg-white dark:bg-slate-950 text-slate-500 relative z-10 text-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 JobPilot AI. Built for developers in India.</p>
          <div className="flex gap-6 font-semibold">
            <Link href="#about" className="hover:text-slate-900 dark:hover:text-slate-350">About Us</Link>
            <a href="#" className="hover:text-slate-900 dark:hover:text-slate-350">Privacy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-slate-350">Terms</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-slate-350">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
