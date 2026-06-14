'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Lock, 
  RefreshCw 
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
  const [appCount, setAppCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count, error } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) throw error;
        setAppCount(count || 0);

        if (count && count >= 10) {
          await runInsightsAnalysis();
        }
      } catch (err) {
        console.error('Failed to load insights preconditions:', err);
      } finally {
        setLoading(false);
      }
    }

    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    window.addEventListener('theme-change', checkTheme);

    loadData();

    return () => window.removeEventListener('theme-change', checkTheme);
  }, [supabase]);

  const runInsightsAnalysis = async () => {
    setInsightsLoading(true);
    setErrorMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users_profile')
        .select('*')
        .single();

      const { data: apps } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          job:job_id (
            title,
            description,
            match_score,
            match_data
          )
        `)
        .eq('user_id', user.id);

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
      setErrorMsg(err.message || 'Failed to compile career insights.');
    } finally {
      setInsightsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  const isLocked = appCount < 10;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-base pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Career Intelligence</h1>
          <p className="text-text-secondary text-[13px] mt-1 font-medium font-sans">AI-driven aggregate insights detailing skills alignment and target suggestions.</p>
        </div>

        {!isLocked && (
          <button
            onClick={runInsightsAnalysis}
            disabled={insightsLoading}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-bg-surface border border-border-base hover:bg-bg-elevated text-text-primary rounded-[6px] text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
            Refresh Analysis
          </button>
        )}
      </div>

      {/* LOCKED STATE VIEW */}
      {isLocked ? (
        <div className="max-w-md mx-auto bg-bg-surface border border-border-base rounded p-8 text-center space-y-6">
          <div className="w-12 h-12 bg-accent-glow border border-accent-primary/10 rounded-full flex items-center justify-center mx-auto text-accent-primary">
            <Lock className="w-5 h-5" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-text-primary text-base">AI Insights Locked</h3>
            <p className="text-text-secondary text-xs leading-relaxed max-w-xs mx-auto">
              Unlock personalized career recommendations, skill gaps analysis, and matching score trends after logging at least <span className="font-bold text-text-primary font-mono">10</span> applications.
            </p>
          </div>

          {/* Progress bar */}
          <div className="max-w-xs mx-auto space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">
              <span>Applications Logged</span>
              <span className="font-mono">{appCount} / 10</span>
            </div>
            <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden border border-border-base">
              <div
                className="bg-accent-primary h-full transition-all duration-505"
                style={{ width: `${Math.min((appCount / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        /* UNLOCKED METRICS GRID */
        <div className="space-y-8">
          
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-[6px] text-xs text-rose-500 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Core Stats overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-bg-surface border border-border-base rounded p-5 relative flex flex-col justify-between h-[110px]">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Best Matching Role</span>
              <p className="font-bold text-text-primary text-base leading-tight mt-2">
                {insights?.best_performing_role_type || 'None identified yet'}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent-primary"></div>
            </div>

            <div className="bg-bg-surface border border-border-base rounded p-5 relative flex flex-col justify-between h-[110px]">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Average Match Score</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-text-primary font-mono">
                  {insights?.match_score_trend && insights.match_score_trend.length > 0
                    ? Math.round(insights.match_score_trend.reduce((a, b) => a + b.score, 0) / insights.match_score_trend.length)
                    : 0}%
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent-green"></div>
            </div>

            <div className="bg-bg-surface border border-border-base rounded p-5 relative flex flex-col justify-between h-[110px]">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Top Skill Deficit</span>
              <p className="font-bold text-text-primary text-base leading-tight capitalize mt-2">
                {insights?.top_skill_gaps?.[0]?.skill || 'None detected'}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent-amber"></div>
            </div>
          </div>

          {/* CHARTS CONTAINER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Average Match Score Trend (Line) */}
            <div className="bg-bg-surface border border-border-base rounded p-5 space-y-4">
              <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2">
                Match Score Growth
              </h3>
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={insights?.match_score_trend || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1E1E2E" : "#E2E8F0"} />
                    <XAxis dataKey="date" stroke={isDark ? "#8B8BA8" : "#475569"} fontSize={10} tickLine={false} />
                    <YAxis stroke={isDark ? "#8B8BA8" : "#475569"} fontSize={10} domain={[40, 100]} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: isDark ? '#111118' : '#FFFFFF', borderColor: isDark ? '#1E1E2E' : '#E2E8F0', color: isDark ? '#F0F0FF' : '#0F172A' }} />
                    <Line type="monotone" dataKey="score" name="Match Score (%)" stroke="#7C5CFC" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Skill Gaps (Bar) */}
            <div className="bg-bg-surface border border-border-base rounded p-5 space-y-4">
              <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2">
                Key Technical Skill Gaps
              </h3>
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insights?.top_skill_gaps || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1E1E2E" : "#E2E8F0"} />
                    <XAxis dataKey="skill" stroke={isDark ? "#8B8BA8" : "#475569"} fontSize={10} tickLine={false} />
                    <YAxis stroke={isDark ? "#8B8BA8" : "#475569"} fontSize={10} allowDecimals={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: isDark ? '#111118' : '#FFFFFF', borderColor: isDark ? '#1E1E2E' : '#E2E8F0', color: isDark ? '#F0F0FF' : '#0F172A' }} />
                    <Bar dataKey="count" name="JD Occurrences" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* LOWER GRID: RECS AND CERTIFICATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recommendations (2/3 width) */}
            <div className="lg:col-span-2 bg-bg-surface border border-border-base rounded p-6 space-y-4">
              <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2">
                Actionable AI Recommendations
              </h3>
              <ul className="space-y-3.5">
                {insights?.recommendations && insights.recommendations.length > 0 ? (
                  insights.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green shrink-0 mt-2"></span>
                      <span>{rec}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-text-tertiary italic text-center py-6">No recommendations calculated yet.</p>
                )}
              </ul>
            </div>

            {/* Certifications suggested (1/3 width) */}
            <div className="bg-bg-surface border border-border-base rounded p-6 space-y-4">
              <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2">
                Suggested Certs
              </h3>
              <div className="space-y-3">
                {insights?.suggested_certifications && insights.suggested_certifications.length > 0 ? (
                  insights.suggested_certifications.map((cert, i) => (
                    <div key={i} className="p-3 bg-bg-elevated border border-border-base rounded text-xs font-semibold text-text-primary hover:bg-bg-elevated/80 transition-colors">
                      {cert}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-tertiary italic text-center py-6">No certifications suggested yet.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
