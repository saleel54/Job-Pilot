'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  source_url: string;
  source: 'adzuna' | 'manual' | 'pasted';
  salary_min?: number | null;
  salary_max?: number | null;
  created: string;
  match_score?: number | null;
  match_data?: any | null;
  is_saved?: boolean;
  db_id?: string | null;
}

export default function JobsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [dbJobs, setDbJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Natural Language Search & Filters
  const [aiSearchInput, setAiSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scoreThreshold, setScoreThreshold] = useState(0);

  // Manual JD state
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [addingManual, setAddingManual] = useState(false);
  const [manualError, setManualError] = useState('');

  // AI query parser regex helper
  const parseNaturalQuery = (text: string) => {
    const lower = text.toLowerCase();
    let q = '';
    let loc = '';

    const keywords = ['react', 'next.js', 'vue', 'angular', 'node', 'python', 'java', 'c#', 'rust', 'go', 'devops', 'frontend', 'backend', 'full stack', 'developer', 'engineer', 'designer', 'typescript', 'docker'];
    const foundKeywords: string[] = [];
    keywords.forEach(kw => {
      if (lower.includes(kw)) {
        foundKeywords.push(kw);
      }
    });

    if (foundKeywords.length > 0) {
      q = foundKeywords.join(' ');
    } else {
      q = text.replace(/find|search|jobs|for|under|years|experience|in/gi, '').trim();
    }

    const locations = ['bangalore', 'bengaluru', 'mumbai', 'pune', 'delhi', 'noida', 'gurgaon', 'hyderabad', 'chennai', 'remote', 'india'];
    const foundLoc = locations.find(l => lower.includes(l));
    if (foundLoc) {
      loc = foundLoc === 'india' ? 'India' : foundLoc.charAt(0).toUpperCase() + foundLoc.slice(1);
    }

    return { query: q, location: loc };
  };

  // Run parsing when search text changes
  useEffect(() => {
    if (!aiSearchInput.trim()) return;
    const parsed = parseNaturalQuery(aiSearchInput);
    setSearchQuery(parsed.query);
    setLocationQuery(parsed.location);
  }, [aiSearchInput]);

  // Fetch jobs from API + DB
  const fetchJobs = async (q = '', loc = '') => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dbJobsList } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id);
      
      const savedList = dbJobsList || [];
      setDbJobs(savedList);

      const queryKeyword = q || 'developer';
      const res = await fetch(`/api/jobs?query=${encodeURIComponent(queryKeyword)}&location=${encodeURIComponent(loc)}`);
      const data = await res.json();
      
      if (data && data.results) {
        const mappedJobs = data.results.map((apiJob: Job) => {
          const matchedDb = savedList.find(
            (dbJob) => 
              dbJob.source_url === apiJob.source_url || 
              (dbJob.title.toLowerCase() === apiJob.title.toLowerCase() && 
               dbJob.company.toLowerCase() === apiJob.company.toLowerCase())
          );
          
          return {
            ...apiJob,
            match_score: matchedDb ? matchedDb.match_score : null,
            match_data: matchedDb ? matchedDb.match_data : null,
            is_saved: matchedDb ? matchedDb.is_saved : false,
            db_id: matchedDb ? matchedDb.id : null,
          };
        });

        setJobs(mappedJobs);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadUserPrefs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users_profile')
        .select('preferences')
        .eq('id', user.id)
        .maybeSingle();

      const prefRoles = profile?.preferences?.target_roles || [];
      const prefLocs = profile?.preferences?.locations || [];

      const initialQuery = prefRoles.length > 0 ? prefRoles[0] : 'developer';
      const initialLoc = prefLocs.length > 0 ? prefLocs[0] : '';
      
      setSearchQuery(initialQuery);
      setLocationQuery(initialLoc);
      setAiSearchInput(`Find ${initialLoc ? initialLoc + ' ' : ''}${initialQuery} jobs`);
      fetchJobs(initialQuery, initialLoc);
    }

    loadUserPrefs();
  }, [supabase]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(searchQuery, locationQuery);
  };

  const handleSuggestionClick = (phrase: string) => {
    setAiSearchInput(phrase);
    const parsed = parseNaturalQuery(phrase);
    fetchJobs(parsed.query, parsed.location);
  };

  const toggleSaveJob = async (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (job.db_id) {
        const newSavedState = !job.is_saved;
        const { error } = await supabase
          .from('jobs')
          .update({ is_saved: newSavedState })
          .eq('id', job.db_id);

        if (error) throw error;
        
        setJobs(jobs.map((j: any) => j.id === job.id ? { ...j, is_saved: newSavedState } : j));
      } else {
        const { data: inserted, error } = await supabase
          .from('jobs')
          .insert({
            user_id: user.id,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            source_url: job.source_url,
            source: 'adzuna',
            is_saved: true
          })
          .select()
          .single();

        if (error) throw error;

        setJobs(jobs.map((j: any) => j.id === job.id ? { ...j, is_saved: true, db_id: inserted.id } : j));
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    setAddingManual(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth session invalid.');

      if (!manualTitle || !manualCompany || !manualDescription) {
        setManualError('Please fill out Title, Company, and Job Description.');
        setAddingManual(false);
        return;
      }

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
          user_id: user.id,
          title: manualTitle,
          company: manualCompany,
          location: manualLocation || 'Remote',
          description: manualDescription,
          source_url: manualUrl,
          source: 'pasted',
          is_saved: true
        })
        .select()
        .single();

      if (error) throw error;

      setManualTitle('');
      setManualCompany('');
      setManualLocation('');
      setManualDescription('');
      setManualUrl('');

      router.push(`/jobs/${newJob.id}`);
    } catch (err: any) {
      console.error(err);
      setManualError(err.message || 'Failed to save job description.');
      setAddingManual(false);
    }
  };

  const navigateToJob = async (job: any) => {
    if (job.db_id) {
      router.push(`/jobs/${job.db_id}`);
    } else {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: inserted, error } = await supabase
          .from('jobs')
          .insert({
            user_id: user.id,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            source_url: job.source_url,
            source: 'adzuna',
            is_saved: false
          })
          .select()
          .single();

        if (error) throw error;
        router.push(`/jobs/${inserted.id}`);
      } catch (err) {
        console.error('Error auto-creating job in DB:', err);
      }
    }
  };

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Competitive LPA';
    const minL = min ? `${(min / 100000).toFixed(0)}` : '';
    const maxL = max ? `${(max / 100000).toFixed(0)}` : '';
    if (minL && maxL) return `₹${minL}–${maxL} LPA`;
    if (minL) return `₹${minL}L+ PA`;
    return `₹${maxL}L PA`;
  };

  const getCompanyAvatarStyle = (companyName: string) => {
    const firstChar = (companyName || 'C').charAt(0).toUpperCase();
    const colors = [
      { bg: 'bg-accent-primary/20 text-accent-primary border-accent-primary/20', text: 'text-accent-primary' },
      { bg: 'bg-accent-green/20 text-accent-green border-accent-green/20', text: 'text-accent-green' },
      { bg: 'bg-accent-amber/20 text-accent-amber border-accent-amber/20', text: 'text-accent-amber' },
      { bg: 'bg-[#7CFFB2]/20 text-[#7CFFB2] border-[#7CFFB2]/20', text: 'text-[#7CFFB2]' },
      { bg: 'bg-rose-500/20 text-rose-400 border-rose-500/20', text: 'text-rose-400' }
    ];
    const index = firstChar.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const filteredJobs = jobs.filter((job) => {
    if (scoreThreshold > 0) {
      return job.match_score !== null && job.match_score !== undefined && job.match_score >= scoreThreshold;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header and Summary */}
      <div className="border-b border-border dark:border-white/5 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary font-heading">Discover</h1>
        <p className="text-text-secondary text-xs mt-1 font-medium font-sans">AI-parsed job feed · India</p>
      </div>

      {/* Grid split: Left is Job search list, Right is Analyze JD tool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT & CENTER: SEARCH & FEED (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI-first Single Command Search */}
          <div className="glass-card p-5 space-y-4 rounded-[24px]">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center h-11 w-full bg-bg-elevated/40 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl px-3 focus-within:border-border-highlight dark:focus-within:border-white/20 transition-all">
              <input
                type="text"
                placeholder="Find remote React jobs under 2 years experience in India..."
                value={aiSearchInput}
                onChange={(e) => setAiSearchInput(e.target.value)}
                className="w-full bg-transparent border-0 text-text-primary text-xs placeholder-text-tertiary focus:outline-none focus:ring-0 pr-8"
              />
              <button
                type="submit"
                className="absolute right-3 w-7 h-7 bg-accent-primary text-white rounded-lg flex items-center justify-center font-bold text-xs hover:bg-accent-primary/95 transition-all"
              >
                →
              </button>
            </form>

            {/* Smart Parsed Indicators */}
            {aiSearchInput && (
              <div className="flex flex-wrap gap-2 text-[10px] items-center pt-2">
                <span className="text-text-secondary font-bold uppercase tracking-wider">AI Parser:</span>
                <span className="px-2.5 py-0.5 bg-bg-elevated/60 dark:bg-white/5 border border-border dark:border-white/5 text-text-secondary rounded-lg font-mono">KEYWORD: {searchQuery || 'None'}</span>
                <span className="px-2.5 py-0.5 bg-bg-elevated/60 dark:bg-white/5 border border-border dark:border-white/5 text-text-secondary rounded-lg font-mono">LOCATION: {locationQuery || 'Anywhere'}</span>

                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="ml-auto text-[10px] uppercase font-bold text-accent-primary hover:underline"
                >
                  {showAdvanced ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>
            )}

            {/* Suggested Prompts */}
            {!aiSearchInput && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] block">Suggested Queries</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    'Find remote React developer jobs',
                    'Node backend engineer in Bangalore',
                    'Full Stack jobs in Delhi NCR',
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => handleSuggestionClick(phrase)}
                      className="text-xs bg-bg-elevated dark:bg-white/5 hover:bg-bg-elevated/80 dark:hover:bg-white/10 border border-border dark:border-white/5 hover:border-border-highlight dark:hover:border-white/10 text-text-secondary hover:text-text-primary px-3.5 py-2 rounded-xl transition-all font-semibold"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced Filters */}
            {(showAdvanced || !aiSearchInput) && (
              <div className="pt-4 border-t border-border dark:border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Keywords</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Location</label>
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Min Match Score</label>
                  <select
                    value={scoreThreshold}
                    onChange={(e) => setScoreThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-semibold"
                  >
                    <option value="0">All Scores</option>
                    <option value="50">50% + Fit</option>
                    <option value="70">70% + Fit</option>
                    <option value="85">85% + Fit (Strong)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Job Feed Cards - Grid Netflix-style layout */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card p-6 rounded-[24px] space-y-4 animate-pulse h-[200px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 w-2/3">
                      <div className="h-4 bg-bg-elevated dark:bg-white/5 rounded w-full"></div>
                      <div className="h-3 bg-bg-elevated dark:bg-white/5 rounded w-1/2"></div>
                    </div>
                    <div className="h-10 w-10 bg-bg-elevated dark:bg-white/5 rounded-xl"></div>
                  </div>
                  <div className="h-3 bg-bg-elevated dark:bg-white/5 rounded w-full my-4"></div>
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-[24px]">
              <h3 className="font-extrabold text-text-primary text-[14px]">No jobs found matching parameters</h3>
              <p className="text-text-secondary text-xs mt-1">Refine your AI Search text or clear min score thresholds.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => {
                const hasScore = job.match_score !== null && job.match_score !== undefined;
                const score = job.match_score || 0;
                
                return (
                  <div
                    key={job.id}
                    onClick={() => navigateToJob(job)}
                    className="glass-card glow-card glass-shine card-hover-rise p-6 rounded-[24px] flex flex-col justify-between min-h-[220px]"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        {/* Logo and Job Info */}
                        <div className="flex gap-3.5 truncate">
                          <div className={`w-10 h-10 rounded-xl font-mono font-bold flex items-center justify-center text-xs shrink-0 border ${getCompanyAvatarStyle(job.company).bg}`}>
                            {(job.company || 'CO').charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <h3 className="font-bold text-text-primary text-[14px] leading-tight truncate">
                              {job.title}
                            </h3>
                            <p className="text-xs font-semibold text-text-secondary mt-0.5 truncate">{job.company}</p>
                          </div>
                        </div>

                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => toggleSaveJob(job, e)}
                          className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                            job.is_saved 
                              ? 'bg-accent-glow border-accent-primary/20 text-accent-primary' 
                              : 'bg-bg-elevated/50 dark:bg-white/5 border-border dark:border-white/5 text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <span className="text-[10px] font-bold font-mono px-1">{job.is_saved ? 'SAVED' : 'SAVE'}</span>
                        </button>
                      </div>

                      {/* Job Snippet */}
                      <p className="text-text-secondary text-xs line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Matched vs Missing skills visualization */}
                      {hasScore && job.match_data && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          {Array.isArray(job.match_data.matched_keywords) && job.match_data.matched_keywords.slice(0, 3).map((k: string) => (
                            <span key={k} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-accent-green text-[9px] font-bold font-mono">
                              {k}
                            </span>
                          ))}
                          {Array.isArray(job.match_data.missing_keywords) && job.match_data.missing_keywords.slice(0, 2).map((k: string) => (
                            <span key={k} className="px-2 py-0.5 rounded bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 text-text-secondary text-[9px] font-bold font-mono">
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata & Analyze Button */}
                    <div className="flex items-center justify-between gap-2 text-[10px] text-text-secondary font-semibold uppercase pt-4 border-t border-border dark:border-white/5 mt-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="truncate max-w-[100px]">{job.location}</span>
                        <span className="text-text-primary font-bold font-mono text-[10px]">
                          {formatSalary(job.salary_min, job.salary_max)}
                        </span>
                      </div>

                      {/* Score Pill / Action Button */}
                      {hasScore ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 px-2.5 py-1 rounded-lg ${score >= 85 ? 'text-accent-green' : score >= 70 ? 'text-accent-amber' : 'text-text-secondary'}`}>
                            {score}% Match
                          </span>
                          <span className="text-[10px] font-bold text-accent-primary hover:text-text-primary dark:hover:text-white transition-colors">Analyze →</span>
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-accent-primary bg-accent-glow hover:bg-accent-primary hover:text-white border border-accent-primary/20 px-3 py-1.5 rounded-lg btn-magnetic transition-colors">
                          Analyze →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SIDE: PASTE JD / ADD JOB (1/3 width) */}
        <div className="glass-card p-6 h-fit space-y-6 rounded-[24px]">
          <h2 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border dark:border-white/5 pb-3">
            Analyze JD
          </h2>

          {manualError && (
            <div className="p-3 text-xs bg-accent-amber/10 text-accent-amber border border-accent-amber/20 rounded-xl">
              {manualError}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Frontend Engineer"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
                Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Razorpay"
                value={manualCompany}
                onChange={(e) => setManualCompany(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore, KA (or Remote)"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
                Original Job URL (Optional)
              </label>
              <input
                type="url"
                placeholder="e.g. https://linkedin.com/jobs/..."
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
                Job Description text (JD) *
              </label>
              <textarea
                required
                placeholder="Paste the full job requirements, description, responsibilities..."
                rows={6}
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-sans leading-relaxed font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={addingManual}
              className="w-full h-10 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 btn-magnetic shadow-lg shadow-accent-primary/25"
            >
              {addingManual ? 'Analyzing...' : 'Run Analysis →'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
