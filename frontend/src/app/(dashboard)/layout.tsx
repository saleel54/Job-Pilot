'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface NavigationItem {
  name: string;
  displayName: string;
  href: string;
  emoji: string;
}

const navItems: NavigationItem[] = [
  { name: 'Dashboard', displayName: 'Dashboard', href: '/dashboard', emoji: '🏠' },
  { name: 'Discover', displayName: 'Discover', href: '/jobs', emoji: '🔍' },
  { name: 'Resume', displayName: 'Resume', href: '/resume', emoji: '📄' },
  { name: 'Tracker', displayName: 'Tracker', href: '/tracker', emoji: '📊' },
  { name: 'AI Coach', displayName: 'AI Coach', href: '/insights', emoji: '🤖' },
  { name: 'Settings', displayName: 'Settings', href: '/settings', emoji: '⚙#' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [userName, setUserName] = useState('Developer');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('users_profile')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();

      // If no profile exists, redirect to onboarding to complete setup
      if (!profile) {
        router.push('/onboarding');
        return;
      }

      if (profile?.name) {
        setUserName(profile.name);
      }
      setLoading(false);
    }

    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    getProfile();
  }, [supabase, router]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row text-text-primary transition-colors duration-200">
      
      {/* DESKTOP SIDEBAR - FLOATING GLASS PANEL */}
      <aside className="hidden md:flex md:w-[240px] md:flex-col md:fixed md:top-4 md:bottom-4 md:left-4 glass-panel rounded-[32px] z-30 shadow-2xl overflow-hidden border border-border dark:border-white/10">
        {/* Brand Logo */}
        <div className="flex items-center justify-center px-6 py-6 border-b border-border dark:border-white/5">
          <Link href="/dashboard" className="flex items-center justify-center">
            <img src="/logo-light.png" alt="JobPilot AI Logo" className="h-32 w-auto object-contain block dark:hidden" />
            <img src="/logo-dark.png" alt="JobPilot AI Logo" className="h-32 w-auto object-contain hidden dark:block" />
          </Link>
        </div>

        {/* User Info Bar with Profile Image */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-border dark:border-white/5 bg-bg-elevated/40 dark:bg-white/[0.02]">
          <div className="w-9 h-9 rounded-full border-2 border-accent-primary/30 overflow-hidden flex-shrink-0">
            <img 
              src="/profile.png" 
              alt={userName} 
              className="w-full h-full object-cover" 
              onError={(e) => { 
                e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Saleel'; 
              }} 
            />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-text-primary truncate">{userName}</p>
            <p className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Candidate Profile</p>
          </div>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center h-10 px-4 mx-1.5 rounded-r-xl border-l-[3px] transition-all duration-200 ${
                  isActive
                    ? 'bg-accent-primary/15 border-accent-primary text-accent-primary font-extrabold scale-[1.01] pl-3.5'
                    : 'border-transparent text-text-secondary hover:bg-accent-primary/[0.08] hover:text-text-primary hover:translate-x-1 pl-4'
                }`}
              >
                <span className="mr-3 text-base">{item.emoji}</span>
                <span>{item.displayName}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border dark:border-white/5 space-y-1.5 bg-bg-elevated/20 dark:bg-white/[0.01]">
          <Link
            href="/about"
            className="flex w-full items-center h-9 px-4 rounded-lg text-xs font-semibold text-text-secondary hover:bg-bg-elevated dark:hover:bg-white/5 hover:text-text-primary transition-all"
          >
            About Us
          </Link>
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between h-9 px-4 rounded-lg text-xs font-semibold text-text-secondary hover:bg-bg-elevated dark:hover:bg-white/5 hover:text-text-primary transition-all"
          >
            <span>Theme</span>
            <span className="font-mono uppercase text-[9px] bg-bg-elevated dark:bg-white/10 px-2 py-0.5 rounded text-text-primary border border-border dark:border-white/5">
              {theme}
            </span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center h-9 px-4 rounded-lg text-xs font-semibold text-text-secondary hover:bg-bg-elevated dark:hover:bg-white/5 hover:text-rose-400 transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV DOCK */}
      <nav className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] h-16 glass-panel rounded-full flex items-center justify-around px-4 shadow-2xl z-50 border border-border dark:border-white/10">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all duration-200 ${
                isActive 
                  ? 'bg-accent-primary/20 border border-accent-primary/30 text-accent-primary scale-110 shadow-lg shadow-accent-primary/10' 
                  : 'text-text-secondary hover:text-text-primary hover:scale-110'
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
            </Link>
          );
        })}
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-[272px] flex flex-col min-h-screen pb-24 md:pb-0">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-bg-surface/85 backdrop-blur-md border-b border-border dark:border-white/5">
          <div className="flex items-center">
            <Link href="/dashboard">
              <img src="/logo-light.png" alt="JobPilot AI Logo" className="h-20 w-auto max-w-[180px] object-contain block dark:hidden" />
              <img src="/logo-dark.png" alt="JobPilot AI Logo" className="h-20 w-auto max-w-[180px] object-contain hidden dark:block" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="px-2.5 py-1 bg-bg-elevated dark:bg-white/5 border border-border dark:border-white/10 rounded-lg text-[10px] font-bold text-text-primary uppercase tracking-wider font-mono hover:bg-bg-elevated/80 dark:hover:bg-white/10 transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={toggleTheme}
              className="px-2.5 py-1 bg-bg-elevated dark:bg-white/5 border border-border dark:border-white/10 rounded-lg text-[10px] font-bold text-text-primary uppercase tracking-wider font-mono hover:bg-bg-elevated/80 dark:hover:bg-white/10 transition-colors"
            >
              {theme}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 md:px-10 md:py-8 max-w-[1400px] w-full mx-auto relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}

