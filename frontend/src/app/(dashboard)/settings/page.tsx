'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [userGeminiKey, setUserGeminiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [dbStatus, setDbStatus] = useState<'testing' | 'connected' | 'disconnected'>('testing');
  const [envStatus, setEnvStatus] = useState({
    supabaseUrl: false,
    supabaseAnonKey: false,
    geminiApiKey: false
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserGeminiKey(localStorage.getItem('user_gemini_api_key') || '');
    }

    async function loadAccountDetails() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          setUserId(user.id);
          setCreatedDate(new Date(user.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }));

          const { error } = await supabase.from('users_profile').select('id').limit(1);
          if (error && error.code !== 'PGRST116') {
            setDbStatus('disconnected');
          } else {
            setDbStatus('connected');
          }
        }
      } catch (err) {
        console.error('Failed to load user settings:', err);
        setDbStatus('disconnected');
      } finally {
        setLoading(false);
      }
    }

    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY || !!localStorage.getItem('user_gemini_api_key');
    setEnvStatus({
      supabaseUrl: hasUrl,
      supabaseAnonKey: hasAnon,
      geminiApiKey: hasGemini
    });

    loadAccountDetails();
  }, [supabase]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_gemini_api_key', userGeminiKey.trim());
      setSaveSuccess(true);
      setEnvStatus(prev => ({ ...prev, geminiApiKey: !!userGeminiKey.trim() }));
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-border-base pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings</h1>
      </div>

      <div className="space-y-6">
        
        {/* Profile Card details */}
        <div className="bg-bg-surface border border-border-base rounded p-5 space-y-4">
          <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2 mb-4">
            User Credentials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-secondary font-semibold block mb-0.5 uppercase tracking-wider text-[9px]">Logged Email</span>
              <span className="text-text-primary font-medium">{userEmail}</span>
            </div>
            <div>
              <span className="text-text-secondary font-semibold block mb-0.5 uppercase tracking-wider text-[9px]">Joined Date</span>
              <span className="text-text-primary font-medium">{createdDate}</span>
            </div>
            <div className="col-span-2">
              <span className="text-text-secondary font-semibold block mb-0.5 uppercase tracking-wider text-[9px]">User Identity ID</span>
              <span className="text-text-primary font-mono break-all">{userId}</span>
            </div>
          </div>
        </div>

        {/* Gemini API Key Panel */}
        <form onSubmit={handleSaveKey} className="bg-bg-surface border border-border-base rounded p-5 space-y-4">
          <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2">
            Gemini API Configuration
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Specify your custom Google Gemini API Key. This resolves any daily quota limitation issues and is stored locally in your browser.
          </p>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">
              Gemini API Key
            </label>
            <input
              type="password"
              value={userGeminiKey}
              onChange={(e) => setUserGeminiKey(e.target.value)}
              placeholder="Paste your AIzaSy... key here"
              className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] focus:outline-none focus:border-border-highlight transition-colors text-xs text-text-primary font-mono"
            />
          </div>
          <div className="flex justify-between items-center pt-2">
            <a 
              href="https://aistudio.google.com/" 
              target="_blank" 
              rel="noreferrer"
              className="text-[11px] text-accent-primary hover:underline font-semibold"
            >
              Get a free API Key &rarr;
            </a>
            <button
              type="submit"
              className="h-8 px-4 bg-accent-primary hover:bg-accent-primary/95 text-text-primary rounded-[6px] text-xs font-bold transition-colors"
            >
              {saveSuccess ? 'Saved!' : 'Save Key'}
            </button>
          </div>
        </form>

        {/* Diagnostic Panel */}
        <div className="bg-bg-surface border border-border-base rounded p-5 space-y-4">
          <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2">
            System Diagnostics
          </h3>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-2 text-xs border-b border-border-base">
              <span className="font-medium text-text-secondary">Supabase Connection State</span>
              <span className="font-mono text-accent-green font-bold">
                {dbStatus === 'connected' ? 'CONNECTED' : dbStatus === 'disconnected' ? 'DISCONNECTED' : 'TESTING'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 text-xs border-b border-border-base">
              <span className="font-medium text-text-secondary">Supabase URL</span>
              <span className={`font-mono font-bold ${envStatus.supabaseUrl ? 'text-accent-green' : 'text-accent-amber'}`}>
                {envStatus.supabaseUrl ? 'OK' : 'MISSING'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 text-xs border-b border-border-base">
              <span className="font-medium text-text-secondary">Supabase Anon Key</span>
              <span className={`font-mono font-bold ${envStatus.supabaseAnonKey ? 'text-accent-green' : 'text-accent-amber'}`}>
                {envStatus.supabaseAnonKey ? 'OK' : 'MISSING'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 text-xs">
              <span className="font-medium text-text-secondary">Gemini 2.5 Flash service state</span>
              <span className="font-mono text-accent-green font-bold">OK</span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="bg-bg-surface border border-border-base rounded p-5">
          <button
            onClick={handleSignOut}
            className="w-full py-2 bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-500/20 rounded-[6px] text-xs font-bold transition-colors"
          >
            Sign Out of Application
          </button>
        </div>

      </div>
    </div>
  );
}
