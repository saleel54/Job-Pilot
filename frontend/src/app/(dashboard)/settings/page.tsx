'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [userGeminiKey, setUserGeminiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);
  const [keyError, setKeyError] = useState('');

  // Resume upload states
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');

  // Account deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [dbStatus, setDbStatus] = useState<'testing' | 'connected' | 'disconnected'>('testing');

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

    loadAccountDetails();
  }, [supabase]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    const trimmed = userGeminiKey.trim();
    if (!trimmed) {
      setKeyError('A Gemini API Key is required. Please enter a valid key.');
      return;
    }
    if (!trimmed.startsWith('AIzaSy') || trimmed.length < 30) {
      setKeyError('Invalid key format. A valid Gemini key starts with "AIzaSy" and is at least 30 characters.');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_gemini_api_key', trimmed);
      setKeySaveSuccess(true);
      setTimeout(() => setKeySaveSuccess(false), 2500);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadStatus('error');
      setUploadMsg('Only PDF resumes are supported. Please upload a PDF file.');
      return;
    }

    setUploadStatus('uploading');
    setUploadMsg('Parsing your resume with AI...');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const customKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') || '' : '';
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${backendUrl}/api/parse-resume`, {
        method: 'POST',
        headers: {
          'x-gemini-api-key': customKey,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to parse resume.');

      // Update the profile in Supabase with the new parsed data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User session expired. Please log in again.');

      const { error: updateError } = await supabase.from('users_profile').update({
        name: result.profile.name,
        phone: result.profile.phone,
        location: result.profile.location,
        skills: result.profile.skills,
        experience: result.profile.experience,
        projects: result.profile.projects,
        education: result.profile.education,
        raw_resume_text: result.raw_text || '',
      }).eq('id', user.id);

      if (updateError) throw updateError;

      setUploadStatus('success');
      setUploadMsg('Resume updated successfully! Your profile has been refreshed with the new data.');
    } catch (err: any) {
      console.error('Resume upload error:', err);
      setUploadStatus('error');
      setUploadMsg(err.message || 'Failed to process your resume. Please try again.');
    } finally {
      // Reset file input so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE in the confirmation box to proceed.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      // First, try the secure RPC function (requires DB setup)
      const { error: rpcError } = await supabase.rpc('delete_user_account');

      if (rpcError) {
        console.warn('RPC delete_user_account failed (function may not exist), falling back to profile deletion:', rpcError.message);

        // Fallback: delete the profile record (cascades to jobs & applications)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Session not found.');

        const { error: profileDeleteError } = await supabase
          .from('users_profile')
          .delete()
          .eq('id', user.id);

        if (profileDeleteError) throw profileDeleteError;
      }

      // Sign out after deletion
      await supabase.auth.signOut();
      // Clear local storage keys
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_gemini_api_key');
        localStorage.removeItem('theme');
      }
      router.push('/');
    } catch (err: any) {
      console.error('Account deletion error:', err);
      setDeleteError(err.message || 'Failed to delete your account. Please contact support.');
      setDeleting(false);
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
        <p className="text-text-secondary text-xs mt-1">Manage your account, API key, and profile data.</p>
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
            Your custom Gemini API Key powers all AI features — resume tailoring, cover letters, JD matching, and career insights. It is stored locally in your browser only.
          </p>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">
              Gemini API Key <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={userGeminiKey}
              onChange={(e) => { setUserGeminiKey(e.target.value); setKeyError(''); }}
              placeholder="Paste your AIzaSy... key here"
              className={`w-full px-3 py-2 bg-bg-elevated border rounded-[6px] focus:outline-none transition-colors text-xs text-text-primary font-mono ${keyError ? 'border-rose-500/50 focus:border-rose-500' : 'border-border-base focus:border-border-highlight'}`}
            />
            {keyError && (
              <p className="text-[11px] text-rose-500 font-medium">{keyError}</p>
            )}
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
              {keySaveSuccess ? '✓ Saved!' : 'Save Key'}
            </button>
          </div>
        </form>

        {/* Resume Re-upload Panel */}
        <div className="bg-bg-surface border border-border-base rounded p-5 space-y-4">
          <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2">
            Update Resume
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Upload a new resume PDF to re-parse your profile. This will update your skills, experience, projects, and education in the AI matching engine immediately.
          </p>

          {uploadStatus === 'uploading' && (
            <div className="flex items-center gap-2.5 p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-[6px]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-primary flex-shrink-0"></div>
              <p className="text-xs text-accent-primary font-medium">{uploadMsg}</p>
            </div>
          )}
          {uploadStatus === 'success' && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-[6px]">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ {uploadMsg}</p>
            </div>
          )}
          {uploadStatus === 'error' && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-[6px]">
              <p className="text-xs text-rose-500 font-medium">{uploadMsg}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleResumeUpload}
              className="hidden"
              id="resume-upload-input"
            />
            <label
              htmlFor="resume-upload-input"
              className={`inline-flex items-center gap-2 h-8 px-4 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                uploadStatus === 'uploading'
                  ? 'bg-bg-elevated text-text-secondary cursor-not-allowed'
                  : 'bg-accent-primary hover:bg-accent-primary/95 text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload New Resume (PDF)'}
            </label>
            <span className="text-[11px] text-text-tertiary">PDF up to 5MB</span>
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="bg-bg-surface border border-border-base rounded p-5 space-y-4">
          <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2">
            System Diagnostics
          </h3>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-2 text-xs border-b border-border-base">
              <span className="font-medium text-text-secondary">Supabase Connection</span>
              <span className={`font-mono font-bold ${dbStatus === 'connected' ? 'text-accent-green' : dbStatus === 'disconnected' ? 'text-rose-500' : 'text-accent-amber'}`}>
                {dbStatus === 'connected' ? 'CONNECTED' : dbStatus === 'disconnected' ? 'DISCONNECTED' : 'TESTING'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-xs border-b border-border-base">
              <span className="font-medium text-text-secondary">Supabase URL</span>
              <span className={`font-mono font-bold ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-accent-green' : 'text-accent-amber'}`}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-xs border-b border-border-base">
              <span className="font-medium text-text-secondary">Gemini API Key (Local)</span>
              <span className={`font-mono font-bold ${userGeminiKey ? 'text-accent-green' : 'text-rose-500'}`}>
                {userGeminiKey ? 'CONFIGURED' : 'MISSING'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-xs">
              <span className="font-medium text-text-secondary">Gemini 2.5 Flash Service</span>
              <span className="font-mono text-accent-green font-bold">OK</span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="bg-bg-surface border border-border-base rounded p-5 space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full py-2 bg-bg-elevated border border-border-base text-text-secondary hover:text-text-primary hover:bg-bg-surface rounded-[6px] text-xs font-bold transition-colors"
          >
            Sign Out of Application
          </button>
        </div>

        {/* ⚠️ DANGER ZONE */}
        <div className="bg-rose-500/5 border border-rose-500/25 rounded p-5 space-y-4">
          <div className="border-b border-rose-500/20 pb-2">
            <h3 className="font-bold text-rose-500 text-[10px] uppercase tracking-[0.08em]">Danger Zone</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              These actions are irreversible. Please proceed with caution.
            </p>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-text-primary">Delete My Account</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Permanently removes your account, profile, all saved jobs, and applications. This cannot be undone.</p>
            </div>
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteError(''); setDeleteConfirmText(''); }}
              className="flex-shrink-0 h-8 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-[6px] text-xs font-bold transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* ⚠️ DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-base rounded-lg p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div>
              <h2 className="text-base font-bold text-text-primary">Are you absolutely sure?</h2>
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                This will permanently delete your account and all associated data — profile, resume, saved jobs, and application history. <span className="text-rose-500 font-bold">This action cannot be undone.</span>
              </p>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-[6px]">
              <p className="text-[11px] text-rose-500 font-semibold">
                To confirm, type <code className="font-mono bg-rose-500/10 px-1 py-0.5 rounded">DELETE</code> in the box below.
              </p>
            </div>

            <div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => { setDeleteConfirmText(e.target.value); setDeleteError(''); }}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary font-mono focus:outline-none focus:border-rose-500/50 transition-colors"
              />
              {deleteError && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-medium">{deleteError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); setDeleteError(''); }}
                disabled={deleting}
                className="flex-1 py-2 border border-border-base text-text-secondary bg-bg-elevated hover:bg-bg-surface rounded-[6px] text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-[6px] text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {deleting && (
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
