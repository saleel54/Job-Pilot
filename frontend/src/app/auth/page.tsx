'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Remove dark class when login page is mounted so that it is always light theme (white theme)
    const isDarkBefore = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    return () => {
      // Re-add dark class if it was there before, so other pages aren't affected
      if (isDarkBefore) {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) throw error;

        if (data?.session) {
          setSuccessMsg('Account created successfully! Logging you in...');
          setTimeout(() => {
            router.push('/onboarding');
          }, 1500);
        } else {
          setSuccessMsg('Sign up successful! Please check your email or sign in.');
          setTimeout(() => {
            setIsSignUp(false);
            setPassword('');
          }, 3000);
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if user has profile
        const { data: profile, error: profileErr } = await supabase
          .from('users_profile')
          .select('id')
          .eq('id', data.user?.id)
          .maybeSingle();

        if (profileErr) {
          console.error('Profile fetch error:', profileErr);
        }

        if (!profile) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to initialize Google login.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex items-center justify-center p-4">
      {/* Background glow highlights */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-accent-secondary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-[32px] border border-border shadow-2xl relative overflow-hidden z-10">
        
        {/* Logo and Tagline (Light theme logo exclusively for login page) */}
        <div className="text-center mb-8">
          <img src="/logo-light.png" alt="JobPilot AI Logo" className="h-32 w-auto mx-auto mb-3 block" />
          <p className="text-text-secondary text-xs mt-1 font-semibold">Accelerate your career in tech</p>
        </div>
 
        {/* Tab Toggle */}
        <div className="flex border-b border-border mb-6 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            className={`flex-1 pb-3 text-xs font-bold transition-colors duration-150 border-b-2 ${
              !isSignUp ? 'border-accent-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 pb-3 text-xs font-bold transition-colors duration-150 border-b-2 ${
              isSignUp ? 'border-accent-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            Sign Up
          </button>
        </div>
 
        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3 mb-4 text-xs bg-accent-amber/10 text-accent-amber border border-accent-amber/25 rounded-xl">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-4 text-xs bg-accent-green/10 text-accent-green border border-accent-green/25 rounded-xl">
            {successMsg}
          </div>
        )}
 
        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full px-3 py-2 bg-bg-elevated/50 border border-border rounded-xl text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-highlight font-semibold"
              />
            </div>
          )}
 
          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-bg-elevated/50 border border-border rounded-xl text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-highlight font-semibold"
            />
          </div>
 
          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-bg-elevated/50 border border-border rounded-xl text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-highlight font-semibold"
            />
          </div>
 
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-gradient-to-r from-[#00D67A] to-[#00A65A] text-[#0A0F0C] rounded-xl text-xs font-bold hover:shadow-[0_10px_30px_rgba(0,214,122,0.35)] transition-all disabled:opacity-50 flex items-center justify-center btn-magnetic shadow-lg"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
 
        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono">
            <span className="bg-bg-surface px-3 text-text-tertiary">Or continue with</span>
          </div>
        </div>
 
        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full h-10 bg-bg-elevated/40 border border-border hover:border-border-highlight text-text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 btn-magnetic"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36s2.81-6.36 6.277-6.36c1.556 0 2.973.567 4.073 1.5l3.074-3.075C18.666 1.967 15.683 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 11.24-4.246 11.24-11.24 0-.768-.068-1.507-.19-1.955H12.24z"
            />
          </svg>
          Google
        </button>
      </div>
    </div>
  );
}
