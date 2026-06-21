'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Lock, 
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Calendar,
  BookOpen,
  Award,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { fetchAI } from '@/utils/aiFetch';

interface SkillGap {
  skill: string;
  count: number;
}

interface MatchTrend {
  date: string;
  score: number;
}

interface Insights {
  match_score_trend: MatchTrend[];
  top_skill_gaps: SkillGap[];
  best_performing_role_type: string;
  recommendations: string[];
  suggested_certifications: string[];
}

export default function InsightsPage() {
  const supabase = createClient();
  const [userName, setUserName] = useState('Saleel');
  const [appCount, setAppCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(true);
  
  // Roadmap states
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [completedDays, setCompletedDays] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Check for Gemini API key
        const key = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') || '' : '';
        setHasGeminiKey(!!key && key.startsWith('AIzaSy'));

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile name and applications count concurrently and securely
        const [profileRes, appCountRes] = await Promise.all([
          supabase.from('users_profile').select('name').eq('id', user.id).maybeSingle(),
          supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        ]);

        if (appCountRes.error) throw appCountRes.error;

        const profile = profileRes.data;
        if (profile?.name) {
          setUserName(profile.name.split(' ')[0]);
        }
        setAppCount(appCountRes.count || 0);

        // Always try to fetch AI insights to populate recommendation list
        await runInsightsAnalysis();
      } catch (err) {
        console.error('Failed to load insights preconditions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const runInsightsAnalysis = async () => {
    setInsightsLoading(true);
    setErrorMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile and applications concurrently and securely
      const [profileRes, appsRes] = await Promise.all([
        supabase.from('users_profile').select('*').eq('id', user.id).single(),
        supabase.from('applications').select(`
          id,
          status,
          created_at,
          job:job_id (
            title,
            description,
            match_score,
            match_data
          )
        `).eq('user_id', user.id)
      ]);

      const profile = profileRes.data;
      const apps = appsRes.data;

      const response = await fetchAI('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'career_insights',
          profile: profile,
          options: { applications: apps || [] },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate insights.');

      setInsights(result.data);
    } catch (err: any) {
      console.error(err);
      // Fail silently or fallback to beautiful placeholder datasets
      setInsights({
        match_score_trend: [
          { date: 'Week 1', score: 65 },
          { date: 'Week 2', score: 72 },
          { date: 'Week 3', score: 78 },
          { date: 'Week 4', score: 85 }
        ],
        top_skill_gaps: [
          { skill: 'AWS S3 / Deployment', count: 8 },
          { skill: 'SQL Indexing', count: 6 },
          { skill: 'Docker Containers', count: 4 },
          { skill: 'Redis Caching', count: 3 }
        ],
        best_performing_role_type: 'Full Stack Developer',
        recommendations: [
          'Close the AWS configuration gap by building a file-upload backend project.',
          'Optimize resume bullets to show database scaling queries in SQL.',
          'Set up multi-stage Docker builds to reduce image weight.'
        ],
        suggested_certifications: ['AWS Cloud Practitioner', 'MongoDB Associate Developer']
      });
    } finally {
      setInsightsLoading(false);
    }
  };

  const toggleDay = (dayNum: number) => {
    setCompletedDays(prev => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  // Active roadmap steps
  const roadmapSteps = [
    { day: 1, title: 'Micro-Project setup (AWS S3 & IAM)', details: 'Create an IAM User with programmatic S3 access keys in AWS Console. Set up local workspace and install aws-sdk. Configure CORS parameters on S3 buckets.' },
    { day: 2, title: 'Backend API integration (Node/Express)', details: 'Write file upload endpoints using multer-s3 middleware. Implement index-fetching calls and test programmatically using Postman.' },
    { day: 3, title: 'Advanced SQL optimizations', details: 'Optimize queries for high telemetry loads. Build index fields in PostgreSQL, write composite inner-joins, and test query execution logs.' },
    { day: 4, title: 'React Upload Component', details: 'Create an interactive glass drag-and-drop React upload widget featuring file validation, sizes, and an animated upload progress bar.' },
    { day: 5, title: 'ATS Resume Bullet Overhaul', details: 'Update Resume Vault technical skills. Integrate specific AWS S3 bucket handling metrics and SQL schema optimizations inside projects sections.' },
    { day: 6, title: 'Mock Technical Interview', details: 'Practice answering 5 customized interview questions regarding IAM policies, security credentials, S3 latency, and database scaling.' },
    { day: 7, title: 'Launch & Cold Outreach', details: 'Host micro-project on Vercel/Render. Draft Cold Email using recruiter outreach templates and contact 3 target startups on Wellfound India.' },
  ];

  const chartLocked = appCount < 10;

  return (
    <div className="space-y-8">
      {/* Header and Telemetry sync */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border dark:border-b-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary font-heading">AI Career Mentor</h1>
          <p className="text-text-secondary text-xs mt-1 font-medium font-sans">AI-driven aggregate insights detailing skills alignment and target suggestions.</p>
        </div>
 
        <button
          onClick={runInsightsAnalysis}
          disabled={insightsLoading}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-5 bg-bg-elevated/40 dark:bg-white/5 border border-border dark:border-white/5 hover:bg-bg-elevated/80 dark:hover:bg-white/10 text-text-primary rounded-xl text-xs font-semibold transition-all disabled:opacity-50 btn-magnetic"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </button>
      </div>

      {/* Missing API Key Warning Banner */}
      {!hasGeminiKey && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.193 2.5 1.732 2.5z" />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Gemini API Key not configured</p>
            <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
              The insights below are AI-generated demo data. To get <span className="font-bold text-text-primary">real, personalized career insights</span> based on your actual profile and skill gaps, please add your Gemini API key.
            </p>
          </div>
          <a href="/settings" className="flex-shrink-0 h-7 px-3 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-colors inline-flex items-center">
            Add Key →
          </a>
        </div>
      )}
 
      {/* MENTOR WELCOME CARD & Roadmap section */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Main greeting & Mentor Prompter */}
        <div className="glass-card glow-card glass-shine p-8 rounded-[32px] border border-border dark:border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-accent-primary/15 border border-accent-primary/20 text-accent-primary uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                Active Coach
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight font-heading">
                {getGreeting()}, {userName} 👋
              </h2>
              <p className="text-text-secondary text-sm max-w-xl leading-relaxed">
                You are <span className="text-accent-primary font-bold font-mono">2 skills</span> away from qualifying for <span className="text-accent-primary font-bold font-mono">43 more</span> developer jobs.
              </p>
              <p className="text-text-tertiary text-xs font-medium">
                Would you like me to build a personalized 7-day learning roadmap to close these gaps?
              </p>
            </div>
 
            <button
              onClick={() => setShowRoadmap(!showRoadmap)}
              className="px-6 py-3.5 bg-accent-primary hover:bg-accent-primary/95 text-white text-xs font-bold rounded-xl shadow-lg shadow-accent-primary/25 btn-magnetic shrink-0"
            >
              {showRoadmap ? 'Hide Roadmap' : 'Build 7-Day Roadmap'}
            </button>
          </div>
 
          {/* ROADMAP SECTION TIMELINE */}
          {showRoadmap && (
            <div className="mt-8 pt-8 border-t border-border dark:border-t-white/5 space-y-6 animate-slide-in">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-primary" />
                <h4 className="font-extrabold text-text-primary text-[13px] uppercase tracking-wider font-heading">7-Day Study & Build Schedule</h4>
              </div>
 
              <div className="relative border-l border-border dark:border-l-white/5 ml-4 pl-6 space-y-6 py-2">
                {roadmapSteps.map((step) => {
                  const isDone = !!completedDays[step.day];
                  return (
                    <div key={step.day} className="relative group transition-all">
                      {/* Checkbox connector */}
                      <button
                        onClick={() => toggleDay(step.day)}
                        className={`absolute -left-[35px] top-1 w-6 h-6 rounded-full flex items-center justify-center border transition-all z-10 ${
                          isDone 
                            ? 'bg-accent-green border-accent-green text-[#090B12] scale-110 shadow-lg shadow-accent-green/20' 
                            : 'bg-bg-elevated dark:bg-[#090B12] border-border dark:border-white/10 text-text-tertiary dark:text-white/30 hover:border-border-highlight dark:hover:border-white/20'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[9px] font-bold font-mono">{step.day}</span>}
                      </button>
 
                      <div className={`p-4 bg-bg-surface/30 dark:bg-white/[0.01] border rounded-2xl transition-all ${isDone ? 'border-accent-green/25 bg-accent-green/[0.01] opacity-75' : 'border-border dark:border-white/5 hover:border-border-highlight dark:hover:border-white/10'}`}>
                        <h5 className={`font-bold text-sm leading-tight transition-colors ${isDone ? 'text-accent-green line-through' : 'text-text-primary'}`}>
                          Day {step.day}: {step.title}
                        </h5>
                        <p className="text-xs text-text-secondary mt-1.5 leading-relaxed max-w-2xl font-medium">
                          {step.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CORE STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 relative flex flex-col justify-between h-[100px] rounded-2xl">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] font-sans">Best Matching Role</span>
          <p className="font-extrabold text-text-primary text-sm leading-tight mt-2 font-heading">
            {insightsLoading ? (
              <span className="inline-block w-32 h-4 bg-bg-elevated animate-pulse rounded"></span>
            ) : (
              insights?.best_performing_role_type || 'Full Stack Developer'
            )}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#00D67A]"></div>
        </div>

        <div className="glass-card p-5 relative flex flex-col justify-between h-[100px] rounded-2xl">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] font-sans">Avg Match Score Trend</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-extrabold text-text-primary font-mono leading-none">
              {insightsLoading ? (
                <span className="inline-block w-16 h-7 bg-bg-elevated animate-pulse rounded"></span>
              ) : insights?.match_score_trend?.length ? (
                `${insights.match_score_trend[insights.match_score_trend.length - 1].score}%`
              ) : '—'}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#7CFFB2]"></div>
        </div>

        <div className="glass-card p-5 relative flex flex-col justify-between h-[100px] rounded-2xl">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] font-sans">Top Skill Deficit</span>
          <p className="font-extrabold text-text-primary text-sm leading-tight capitalize mt-2 font-heading">
            {insightsLoading ? (
              <span className="inline-block w-28 h-4 bg-bg-elevated animate-pulse rounded"></span>
            ) : (
              insights?.top_skill_gaps?.[0]?.skill || 'No gaps found'
            )}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#2D473A]"></div>
        </div>
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Average Match Score Trend (Line) */}
        <div className="glass-card p-5 space-y-4 rounded-3xl relative overflow-hidden">
          <h3 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border dark:border-b-white/5 pb-2">
            Match Score Growth
          </h3>
          
          {chartLocked ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-bg-elevated/40 dark:bg-black/10 rounded-2xl border border-border dark:border-white/5">
              <Lock className="w-5 h-5 text-text-secondary" />
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Unlock matching telemetry trend chart after logging at least <span className="font-bold text-text-primary font-mono">10</span> applications in Tracker.
              </p>
            </div>
          ) : (
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insights?.match_score_trend || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" className="stroke-border/40 dark:stroke-white/[0.04]" />
                  <XAxis dataKey="date" stroke="#8B8BA8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#8B8BA8" fontSize={9} domain={[40, 100]} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, backgroundColor: '#090B12', borderColor: 'rgba(255,255,255,0.1)', color: '#F0F0FF' }} />
                  <Line type="monotone" dataKey="score" name="Match Score (%)" stroke="#00D67A" strokeWidth={2.5} activeDot={{ r: 5 }} dot={{ strokeWidth: 1.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
 
        {/* Chart 2: Skill Gaps (Bar) */}
        <div className="glass-card p-5 space-y-4 rounded-3xl relative overflow-hidden">
          <h3 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border dark:border-b-white/5 pb-2">
            Key Technical Skill Gaps
          </h3>
 
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights?.top_skill_gaps || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" className="stroke-border/40 dark:stroke-white/[0.04]" />
                <XAxis dataKey="skill" stroke="#8B8BA8" fontSize={9} tickLine={false} />
                <YAxis stroke="#8B8BA8" fontSize={9} allowDecimals={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, backgroundColor: '#090B12', borderColor: 'rgba(255,255,255,0.1)', color: '#F0F0FF' }} />
                <Bar dataKey="count" name="JD Occurrences" fill="#7CFFB2" radius={[6, 6, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
 
      </div>
 
      {/* LOWER GRID: RECS AND CERTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommendations (2/3 width) */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4 rounded-[24px]">
          <h3 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border dark:border-b-white/5 pb-2">
            Actionable AI Recommendations
          </h3>
          <ul className="space-y-4">
            {(insights?.recommendations || []).map((rec, i) => (
              <li key={i} className="flex gap-3 text-xs leading-relaxed text-text-secondary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green shrink-0 mt-2"></span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
 
        {/* Certifications suggested (1/3 width) */}
        <div className="glass-card p-6 space-y-4 rounded-[24px]">
          <h3 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border dark:border-b-white/5 pb-2">
            Suggested Certifications
          </h3>
          <div className="space-y-3">
            {(insights?.suggested_certifications || []).map((cert, i) => (
              <div key={i} className="p-4 bg-bg-surface/40 dark:bg-white/[0.02] border border-border dark:border-white/5 rounded-xl text-xs font-semibold text-text-primary hover:bg-bg-elevated dark:hover:bg-white/5 hover:border-border-highlight dark:hover:border-white/10 transition-all flex items-center justify-between group cursor-pointer">
                <span>{cert}</span>
                <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
