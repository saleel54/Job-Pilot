'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface NavigationItem {
  name: string;
  displayName: string;
  href: string;
}

const navItems: NavigationItem[] = [
  { name: 'Dashboard', displayName: 'Dashboard', href: '/dashboard' },
  { name: 'Discover', displayName: 'Discover', href: '/jobs' },
  { name: 'Resume', displayName: 'Resume', href: '/resume' },
  { name: 'Tracker', displayName: 'Tracker', href: '/tracker' },
  { name: 'AI Coach', displayName: 'AI Coach', href: '/insights' },
  { name: 'Settings', displayName: 'Settings', href: '/settings' },
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
        .maybeSingle();

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
    <div className="min-h-screen bg-bg-base flex flex-col md:flex-row text-text-primary transition-colors duration-200">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-[220px] md:flex-col md:fixed md:inset-y-0 bg-bg-base z-30" style={{ boxShadow: 'inset -1px 0 0 0 var(--border)' }}>
        {/* Brand Logo */}
        <div className="flex items-center px-6 py-5 border-b border-border-base">
          <img src="/logo-light.png" alt="JobPilot AI Logo" className="h-18 w-auto max-w-[170px] object-contain block dark:hidden" />
          <img src="/logo-dark.png" alt="JobPilot AI Logo" className="h-18 w-auto max-w-[170px] object-contain hidden dark:block" />
        </div>

        {/* User Info Bar */}
        <div className="px-6 py-4 flex flex-col gap-1 border-b border-border-base">
          <p className="text-xs font-semibold text-text-primary truncate">{userName}</p>
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Candidate Profile</p>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center h-9 px-3 rounded text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-accent-glow text-text-primary border-l-2 border-accent-primary pl-2.5'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                }`}
              >
                {item.displayName}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-base space-y-2">
          <Link
            href="/about"
            className="flex w-full items-center h-9 px-4 rounded text-xs font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all"
          >
            About Us
          </Link>
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between h-9 px-4 rounded text-xs font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all"
          >
            <span>Theme</span>
            <span className="font-mono uppercase text-[10px] bg-bg-elevated border border-border-base px-2 py-0.5 rounded text-text-primary">
              {theme}
            </span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center h-9 px-4 rounded text-xs font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border-base flex justify-around py-3 px-1 z-40">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`py-1 px-2.5 rounded text-[10px] font-bold tracking-wider uppercase transition-all ${
                isActive ? 'text-accent-primary bg-accent-glow' : 'text-text-secondary'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-[220px] flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-bg-surface border-b border-border-base">
          <div className="flex items-center">
            <img src="/logo-light.png" alt="JobPilot AI Logo" className="h-16 w-auto max-w-[150px] object-contain block dark:hidden" />
            <img src="/logo-dark.png" alt="JobPilot AI Logo" className="h-16 w-auto max-w-[150px] object-contain hidden dark:block" />
          </div>
          <button
            onClick={toggleTheme}
            className="px-2.5 py-1 bg-bg-elevated border border-border-base rounded text-[10px] font-bold text-text-primary uppercase tracking-wider font-mono"
          >
            {theme}
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8 md:px-10 md:py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
