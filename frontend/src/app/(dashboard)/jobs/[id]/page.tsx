'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Bookmark, 
  Mail, 
  ExternalLink, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  Eye, 
  ThumbsUp
} from 'lucide-react';
import ResumePDF from '@/components/ResumePDF';
import { fetchAI } from '@/utils/aiFetch';

// Dynamically load PDFDownloadLink client-side only
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  source_url: string;
  source: 'adzuna' | 'manual' | 'pasted';
  match_score?: number | null;
  match_data?: any | null;
  is_saved: boolean;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobID = params.id as string;
  const supabase = createClient();

  const [job, setJob] = useState<Job | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'match' | 'tailor' | 'letter' | 'outreach'>('match');

  // Match State
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState('');

  // Tailor State
  const [tailorLoading, setTailorLoading] = useState(false);
  const [tailoredData, setTailoredData] = useState<any>(null);
  const [acceptedChanges, setAcceptedChanges] = useState<Record<number, boolean>>({});
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Cover Letter State
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterTone, setLetterTone] = useState<'formal' | 'startup-casual'>('formal');
  const [coverLetter, setCoverLetter] = useState('');
  const [letterCopied, setLetterCopied] = useState(false);

  // Outreach State
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachType, setOutreachType] = useState<'linkedin' | 'cold_email'>('linkedin');
  const [outreachMessage, setOutreachMessage] = useState('');
  const [outreachSubject, setOutreachSubject] = useState('');
  const [outreachCopied, setOutreachCopied] = useState(false);

  // Tracker State
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [isAddedToTracker, setIsAddedToTracker] = useState(false);

  useEffect(() => {
    async function loadJobAndProfile() {
      try {
        setLoading(true);
        // Fetch profile
        const { data: userProfile } = await supabase
          .from('users_profile')
          .select('*')
          .maybeSingle();

        setProfile(userProfile);

        // Fetch job
        const { data: jobData } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobID)
          .single();

        if (jobData) {
          setJob(jobData);
          
          // Check if already in applications tracker
          const { data: appData } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', jobID)
            .maybeSingle();

          if (appData) {
            setIsAddedToTracker(true);
          }
        }
      } catch (err) {
        console.error('Error loading job details:', err);
      } finally {
        setLoading(false);
      }
    }

    if (jobID) {
      loadJobAndProfile();
    }
  }, [jobID, supabase]);

  // Run or Load Match Analysis
  useEffect(() => {
    const currentJob = job;
    if (!currentJob || !profile || matchLoading) return;
    
    // If already analyzed (score is not null), stop
    if (currentJob.match_score !== null && currentJob.match_score !== undefined) return;

    // Run AI analysis
    async function runAnalysis() {
      if (!currentJob) return;
      setMatchLoading(true);
      setMatchError('');
      try {
        const response = await fetchAI('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature: 'match_analysis',
            profile: profile,
            jd: currentJob.description,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to match JD.');

        const analysis = result.data;

        // Cache result in database
        const { error } = await supabase
          .from('jobs')
          .update({
            match_score: analysis.match_score,
            match_data: analysis,
          })
          .eq('id', currentJob.id);

        if (error) throw error;

        // Update local state
        setJob((prev) => prev ? { ...prev, match_score: analysis.match_score, match_data: analysis } : null);
      } catch (err: any) {
        console.error(err);
        setMatchError(err.message || 'Error occurred while comparing profile and job requirements.');
      } finally {
        setJob((prev) => prev ? { ...prev, match_score: prev.match_score || 0 } : null); // Fallback to avoid infinite loops if error occurs
        setMatchLoading(false);
      }
    }

    runAnalysis();
  }, [job, profile, supabase]);

  // Run Resume Tailoring
  const handleTailorResume = async () => {
    if (!job || !profile) return;
    setTailorLoading(true);
    try {
      const response = await fetchAI('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'tailor_resume',
          profile: profile,
          jd: job.description,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to tailor resume.');

      setTailoredData(result.data);
      
      // Initialize accepted changes as all true by default
      const changesInit: Record<number, boolean> = {};
      result.data.changes_made.forEach((_: any, idx: number) => {
        changesInit[idx] = true;
      });
      setAcceptedChanges(changesInit);

    } catch (err) {
      console.error(err);
    } finally {
      setTailorLoading(false);
    }
  };

  // Compile Tailored profile based on Accepted/Rejected Changes
  const getCompiledProfile = () => {
    if (!profile) return null;
    if (!tailoredData) return profile;

    // We build a profile where we conditionally merge tailored details if accepted
    const isTailorAccepted = Object.values(acceptedChanges).some((v) => v === true);

    if (!isTailorAccepted) {
      return profile;
    }

    return {
      ...profile,
      experience: tailoredData.experience || profile.experience,
      projects: tailoredData.projects || profile.projects,
      skills: tailoredData.skills || profile.skills,
    };
  };

  // Generate Cover Letter
  const handleGenerateCoverLetter = async () => {
    if (!job || !profile) return;
    setLetterLoading(true);
    try {
      const response = await fetchAI('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'cover_letter',
          profile: profile,
          jd: job.description,
          options: { tone: letterTone },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate cover letter.');

      setCoverLetter(result.data.cover_letter);
    } catch (err) {
      console.error(err);
    } finally {
      setLetterLoading(false);
    }
  };

  // Generate Outreach
  const handleGenerateOutreach = async () => {
    if (!job || !profile) return;
    setOutreachLoading(true);
    try {
      const response = await fetchAI('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'outreach',
          profile: profile,
          jd: job.description,
          options: { message_type: outreachType },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate outreach message.');

      setOutreachMessage(result.data.body);
      setOutreachSubject(result.data.subject || '');
    } catch (err) {
      console.error(err);
    } finally {
      setOutreachLoading(false);
    }
  };

  // Add job to applications tracker
  const addToTracker = async () => {
    if (!job) return;
    setTrackerLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          job_id: job.id,
          status: 'saved',
          resume_version: getCompiledProfile(),
          cover_letter: coverLetter || null,
          status_history: [{ status: 'saved', changed_at: new Date().toISOString() }],
        });

      if (error) throw error;
      setIsAddedToTracker(true);
    } catch (err) {
      console.error('Failed to save to tracker:', err);
    } finally {
      setTrackerLoading(false);
    }
  };

  // Helpers
  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxtFile = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading || !job) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  // Color mappings based on score
  const scoreColorClass = (score: number) => {
    if (score >= 85) return 'text-accent-green border-accent-green/20 bg-accent-green/10';
    if (score >= 70) return 'text-accent-amber border-accent-amber/20 bg-accent-amber/10';
    return 'text-rose-500 border-rose-500/20 bg-rose-500/10';
  };

  const progressRingColor = (score: number) => {
    if (score >= 85) return 'var(--accent-green)';
    if (score >= 70) return 'var(--accent-amber)';
    return '#f43f5e'; // Rose color equivalent to text-rose-500
  };

  const ringCircumference = 2 * Math.PI * 30; // r=30
  const matchPercent = job.match_score || 0;
  const strokeDashoffset = ringCircumference - (matchPercent / 100) * ringCircumference;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link 
        href="/jobs" 
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Jobs Feed
      </Link>

      {/* Header Panel */}
      <div className="bg-bg-surface border border-border-base rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="font-mono text-[10px] font-bold text-accent-primary bg-accent-glow border border-accent-primary/20 px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
            {job.source === 'adzuna' ? 'Adzuna Fetch' : 'Pasted JD'}
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary mt-2">{job.title}</h1>
          <p className="text-xs font-semibold text-text-secondary mt-1">{job.company} — {job.location}</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {job.source_url && (
            <a
              href={job.source_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-border-base text-text-primary bg-bg-elevated hover:bg-bg-surface rounded-[6px] text-xs font-semibold transition-colors"
            >
              Apply Link
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={addToTracker}
            disabled={isAddedToTracker || trackerLoading}
            className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[6px] text-xs font-semibold transition-all ${
              isAddedToTracker 
                ? 'bg-bg-elevated border border-border-base text-text-tertiary cursor-default' 
                : 'bg-accent-primary text-text-primary hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            {trackerLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isAddedToTracker ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent-green" />
                Saved to Tracker
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                Save to Tracker
              </>
            )}
          </button>
        </div>
      </div>

      {/* TAB SELECTOR */}
      <div className="flex border-b border-border-base px-1">
        {(['match', 'tailor', 'letter', 'outreach'] as const).map((tab) => (
          <button
            key={tab}
            className={`px-4 pb-2.5 text-xs font-bold border-b-2 transition-colors uppercase tracking-wider ${
              activeTab === tab 
                ? 'border-accent-primary text-text-primary' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'match' && 'JD Match'}
            {tab === 'tailor' && 'Tailor Resume'}
            {tab === 'letter' && 'Cover Letter'}
            {tab === 'outreach' && 'Outreach'}
          </button>
        ))}
      </div>

      {/* TAB 1: MATCH ANALYSIS */}
      {activeTab === 'match' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match Score circular summary card */}
          <div className="bg-bg-surface border border-border-base rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-text-secondary text-[10px] mb-6 uppercase tracking-wider">Overall Match Score</h3>
            
            {matchLoading ? (
              <div className="py-8 flex flex-col items-center">
                <RefreshCw className="w-6 h-6 text-accent-primary animate-spin mb-3" />
                <p className="text-xs text-text-secondary">Analyzing skills alignment...</p>
              </div>
            ) : matchError ? (
              <div className="text-center p-4">
                <AlertTriangle className="w-6 h-6 text-accent-amber mx-auto mb-2" />
                <p className="text-xs text-text-secondary">{matchError}</p>
              </div>
            ) : (
              <>
                {/* SVG Circular Progress Ring */}
                <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="30"
                      stroke="var(--bg-elevated)"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="30"
                      stroke={progressRingColor(matchPercent)}
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xl font-mono font-bold text-text-primary">{matchPercent}%</span>
                </div>

                <span className={`px-3 py-1 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider border ${scoreColorClass(matchPercent)}`}>
                  {job.match_data?.recommendation || 'Calculating...'}
                </span>
              </>
            )}
          </div>

          {/* Detailed analysis feedback (2/3 width) */}
          <div className="lg:col-span-2 bg-bg-surface border border-border-base rounded-lg p-6 space-y-6">
            <div>
              <h3 className="font-bold text-text-primary text-sm mb-2">Job Description Match Analysis</h3>
              {job.match_data?.fit_summary ? (
                <p className="text-text-secondary text-xs leading-relaxed">{job.match_data.fit_summary}</p>
              ) : (
                <p className="text-text-tertiary text-xs italic">Analyzing matching points...</p>
              )}
            </div>

            {/* Keyword Pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-base">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                  Matched Keywords ({job.match_data?.matched_keywords?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.match_data?.matched_keywords?.map((kw: string) => (
                    <span key={kw} className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20">
                      {kw}
                    </span>
                  )) || <span className="text-text-tertiary text-xs italic">None detected yet</span>}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  Missing Keywords ({job.match_data?.missing_keywords?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.match_data?.missing_keywords?.map((kw: string) => (
                    <span key={kw} className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      {kw}
                    </span>
                  )) || <span className="text-text-tertiary text-xs italic">None detected yet</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TAILOR RESUME */}
      {activeTab === 'tailor' && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-base rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-text-primary text-sm">AI Resume Tailoring</h3>
              <p className="text-text-secondary text-xs mt-0.5">Adjust experience bullets and highlight key keywords from the JD without fabrication.</p>
            </div>
            {!tailoredData && (
              <button
                onClick={handleTailorResume}
                disabled={tailorLoading}
                className="px-4 py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {tailorLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Tailor Resume
              </button>
            )}

            {tailoredData && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPdfPreview(!showPdfPreview)}
                  className="px-4 py-2 border border-border-base bg-bg-elevated text-text-primary rounded-[6px] text-xs font-semibold hover:bg-bg-surface flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showPdfPreview ? 'Show Diff' : 'Preview PDF'}
                </button>
                <PDFDownloadLink
                  document={<ResumePDF profile={getCompiledProfile()} />}
                  fileName={`Resume_Tailored_${job.company.replace(/\s+/g, '_')}.pdf`}
                  className="px-4 py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 transition-all"
                >
                  {({ loading: pdfLoading }) => (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      {pdfLoading ? 'Preparing...' : 'Download PDF'}
                    </>
                  )}
                </PDFDownloadLink>
              </div>
            )}
          </div>

          {tailoredData && !showPdfPreview && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Changes made controller list (1/3 width) */}
              <div className="bg-bg-surface border border-border-base rounded-lg p-6 space-y-4 h-fit">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-border-base pb-2 flex items-center justify-between">
                  <span>Modifications Log</span>
                  <span className="text-[10px] font-mono text-accent-primary bg-accent-glow px-2 py-0.5 rounded border border-accent-primary/20">
                    {Object.values(acceptedChanges).filter(Boolean).length} Accepted
                  </span>
                </h4>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {tailoredData.changes_made.map((change: string, idx: number) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2.5 p-2 rounded-[6px] hover:bg-bg-elevated cursor-pointer text-xs transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={acceptedChanges[idx] || false}
                        onChange={(e) => setAcceptedChanges({ ...acceptedChanges, [idx]: e.target.checked })}
                        className="mt-0.5 rounded border-border-base bg-bg-elevated text-accent-primary focus:ring-accent-primary"
                      />
                      <span className="text-text-secondary leading-relaxed font-medium">{change}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Side by side original vs tailored view (2/3 width) */}
              <div className="lg:col-span-2 bg-bg-surface border border-border-base rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Original Profile */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-border-base pb-2">
                      Original Experience & Skills
                    </h4>
                    
                    {profile?.experience?.slice(0, 2).map((exp: any, i: number) => (
                      <div key={i} className="p-3 bg-bg-elevated/50 border border-border-base rounded-[6px] text-xs space-y-1">
                        <p className="font-bold text-text-primary">{exp.role}</p>
                        <p className="text-text-secondary font-medium">{exp.company}</p>
                        <ul className="list-disc pl-4 space-y-1 text-text-secondary mt-2">
                          {exp.description?.map((d: string, j: number) => (
                            <li key={j}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Tailored Preview */}
                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-border-base pt-4 md:pt-0 md:pl-6">
                    <h4 className="text-[10px] font-bold text-accent-primary uppercase tracking-wider border-b border-border-base pb-2 flex items-center justify-between">
                      <span>Tailored Preview</span>
                      <span className="text-[10px] font-normal text-text-tertiary italic">Accept changes to apply</span>
                    </h4>

                    {tailoredData.experience?.slice(0, 2).map((exp: any, i: number) => (
                      <div key={i} className="p-3 bg-accent-glow border border-accent-primary/20 rounded-[6px] text-xs space-y-1">
                        <p className="font-bold text-text-primary flex items-center gap-1.5">
                          {exp.role}
                          <ThumbsUp className="w-3.5 h-3.5 text-accent-primary" />
                        </p>
                        <p className="text-text-secondary font-medium">{exp.company}</p>
                        <ul className="list-disc pl-4 space-y-1 text-text-primary mt-2">
                          {exp.description?.map((d: string, j: number) => (
                            <li key={j} className="bg-accent-primary/10 text-text-primary px-1 py-0.5 rounded-[4px]">{d}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tailoredData && showPdfPreview && (
            <div className="bg-bg-elevated border border-border-base rounded-lg p-4 flex justify-center items-center min-h-[500px]">
              {/* PDF Preview panel client-side */}
              <div className="bg-white p-8 max-w-2xl w-full text-slate-800 shadow-none border border-border-base font-sans text-xs space-y-6">
                <div className="text-center border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-bold uppercase tracking-tight">{getCompiledProfile()?.name}</h2>
                  <p className="text-slate-505 mt-1">
                    {getCompiledProfile()?.email} | {getCompiledProfile()?.phone} | {getCompiledProfile()?.location}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xs font-bold text-indigo-600 border-b border-slate-100 pb-1 uppercase tracking-wider mb-2">Experience</h3>
                  {getCompiledProfile()?.experience?.map((exp: any, i: number) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between font-bold">
                        <span>{exp.role}</span>
                        <span className="text-slate-400 font-normal">{exp.duration}</span>
                      </div>
                      <p className="text-slate-500 italic mb-1">{exp.company}</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {exp.description?.map((desc: string, j: number) => (
                          <li key={j}>{desc}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-indigo-600 border-b border-slate-100 pb-1 uppercase tracking-wider mb-2">Projects</h3>
                  {getCompiledProfile()?.projects?.map((proj: any, i: number) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between font-bold">
                        <span>{proj.name}</span>
                        <span className="text-slate-400 font-normal">({proj.technologies?.join(', ')})</span>
                      </div>
                      <p className="mt-1">{proj.description}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-indigo-600 border-b border-slate-100 pb-1 uppercase tracking-wider mb-2">Skills</h3>
                  <p className="flex flex-wrap gap-2">
                    {getCompiledProfile()?.skills?.map((s: string) => (
                      <span key={s} className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{s}</span>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COVER LETTER */}
      {activeTab === 'letter' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Bar (1/3) */}
          <div className="bg-bg-surface border border-border-base rounded-lg p-6 space-y-6 h-fit">
            <div>
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">Tone Setting</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setLetterTone('formal')}
                  className={`flex-1 py-2 rounded-[6px] text-xs font-bold border transition-colors ${
                    letterTone === 'formal'
                      ? 'bg-accent-glow border-accent-primary/20 text-accent-primary'
                      : 'bg-bg-elevated border-border-base text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                  }`}
                >
                  Formal
                </button>
                <button
                  onClick={() => setLetterTone('startup-casual')}
                  className={`flex-1 py-2 rounded-[6px] text-xs font-bold border transition-colors ${
                    letterTone === 'startup-casual'
                      ? 'bg-accent-glow border-accent-primary/20 text-accent-primary'
                      : 'bg-bg-elevated border-border-base text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                  }`}
                >
                  Startup Casual
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateCoverLetter}
              disabled={letterLoading}
              className="w-full py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {letterLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {coverLetter ? 'Regenerate Cover Letter' : 'Generate Cover Letter'}
            </button>

            {coverLetter && (
              <div className="flex flex-col gap-2 pt-4 border-t border-border-base">
                <button
                  onClick={() => copyToClipboard(coverLetter, setLetterCopied)}
                  className="w-full py-2 border border-border-base text-text-primary bg-bg-elevated hover:bg-bg-surface rounded-[6px] text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {letterCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-accent-green" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy to Clipboard
                    </>
                  )}
                </button>

                <button
                  onClick={() => downloadTxtFile(coverLetter, 'Cover_Letter.txt')}
                  className="w-full py-2 border border-border-base text-text-primary bg-bg-elevated hover:bg-bg-surface rounded-[6px] text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download as .txt
                </button>
              </div>
            )}
          </div>

          {/* Letter Editor Textarea (2/3) */}
          <div className="lg:col-span-2 bg-bg-surface border border-border-base rounded-lg p-6 flex flex-col min-h-[300px]">
            {coverLetter ? (
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full flex-1 p-3 bg-bg-elevated border border-border-base rounded-[6px] text-xs focus:outline-none focus:border-accent-primary font-mono leading-relaxed text-text-primary"
                rows={12}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Mail className="w-10 h-10 text-text-tertiary mb-3" />
                <p className="text-text-secondary text-xs">No cover letter generated yet.</p>
                <p className="text-text-tertiary text-[11px] mt-1">Select a tone on the left and click &quot;Generate Cover Letter&quot; to begin.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RECRUITER OUTREACH */}
      {activeTab === 'outreach' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Bar (1/3) */}
          <div className="bg-bg-surface border border-border-base rounded-lg p-6 space-y-6 h-fit">
            <div>
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">Outreach Type</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setOutreachType('linkedin')}
                  className={`flex-1 py-2 rounded-[6px] text-xs font-bold border transition-colors ${
                    outreachType === 'linkedin'
                      ? 'bg-accent-glow border-accent-primary/20 text-accent-primary'
                      : 'bg-bg-elevated border-border-base text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                  }`}
                >
                  LinkedIn DM
                </button>
                <button
                  onClick={() => setOutreachType('cold_email')}
                  className={`flex-1 py-2 rounded-[6px] text-xs font-bold border transition-colors ${
                    outreachType === 'cold_email'
                      ? 'bg-accent-glow border-accent-primary/20 text-accent-primary'
                      : 'bg-bg-elevated border-border-base text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                  }`}
                >
                  Cold Email
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateOutreach}
              disabled={outreachLoading}
              className="w-full py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {outreachLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {outreachMessage ? 'Regenerate Message' : 'Generate Outreach'}
            </button>

            {outreachMessage && (
              <button
                onClick={() => copyToClipboard(
                  outreachSubject ? `Subject: ${outreachSubject}\n\n${outreachMessage}` : outreachMessage, 
                  setOutreachCopied
                )}
                className="w-full py-2 border border-border-base text-text-primary bg-bg-elevated hover:bg-bg-surface rounded-[6px] text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {outreachCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-accent-green" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            )}
          </div>

          {/* Output Display Card (2/3) */}
          <div className="lg:col-span-2 bg-bg-surface border border-border-base rounded-lg p-6 flex flex-col min-h-[300px]">
            {outreachMessage ? (
              <div className="space-y-4">
                {outreachType === 'cold_email' && outreachSubject && (
                  <div className="p-3 bg-bg-elevated border border-border-base rounded-[6px]">
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">SUBJECT LINE:</p>
                    <p className="text-xs font-semibold text-text-primary mt-1">{outreachSubject}</p>
                  </div>
                )}
                <div className="p-4 border border-border-base rounded-[6px] bg-bg-elevated/30 whitespace-pre-wrap text-xs leading-relaxed text-text-primary font-mono min-h-[200px]">
                  {outreachMessage}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Mail className="w-10 h-10 text-text-tertiary mb-3" />
                <p className="text-text-secondary text-xs">No outreach message generated yet.</p>
                <p className="text-text-tertiary text-[11px] mt-1">Select an outreach format and click &quot;Generate Outreach&quot; to begin.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
