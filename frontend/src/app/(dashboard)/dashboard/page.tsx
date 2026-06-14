'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  match_score?: number | null;
  is_saved?: boolean;
  db_id?: string | null;
  source_url?: string;
  description?: string;
}

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
}

function AnimatedCounter({ value, suffix = '', duration = 800 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    
    const stepTime = Math.max(Math.floor(duration / end), 15);
    const timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span className="font-mono">{displayValue}{suffix}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userName, setUserName] = useState('Developer');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    savedCount: 0,
    appliedCount: 0,
    interviewCount: 0,
    offerCount: 0,
    bestMatch: 0,
    resumeStrength: 0,
    qualifyCount: 0,
    topMissingSkill: '',
  });

  const [recommendations, setRecommendations] = useState<RecommendedJob[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profile } = await supabase
          .from('users_profile')
          .select('*')
          .maybeSingle();

        if (profile?.name) {
          setUserName(profile.name);
        }

        // Calculate dynamic resume strength
        let strength = 35;
        if (profile) {
          if (profile.name) strength += 10;
          if (profile.email) strength += 5;
          if (profile.phone) strength += 5;
          if (Array.isArray(profile.skills) && profile.skills.length > 0) strength += 15;
          if (Array.isArray(profile.experience) && profile.experience.length > 0) strength += 15;
          if (Array.isArray(profile.projects) && profile.projects.length > 0) strength += 10;
          if (Array.isArray(profile.education) && profile.education.length > 0) strength += 5;
        }

        // Fetch application stats
        const { data: apps } = await supabase
          .from('applications')
          .select('status, created_at, job:job_id(match_score)');

        // Fetch jobs for aggregate score check
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, title, company, source_url, match_score, is_saved, match_data');

        // Extract heatmap application counts
        const appDates: Record<string, number> = {};
        apps?.forEach(app => {
          if (app.created_at) {
            const dateStr = new Date(app.created_at).toISOString().split('T')[0];
            appDates[dateStr] = (appDates[dateStr] || 0) + 1;
          }
        });
        setHeatmapData(appDates);

        // Find most common missing skill
        const missingSkillCounts: Record<string, number> = {};
        jobs?.forEach(j => {
          const missing = j.match_data?.missing_keywords;
          if (Array.isArray(missing)) {
            missing.forEach((sk: string) => {
              missingSkillCounts[sk] = (missingSkillCounts[sk] || 0) + 1;
            });
          }
        });
        let topMissingSkill = '';
        let maxCount = 0;
        Object.entries(missingSkillCounts).forEach(([sk, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topMissingSkill = sk;
          }
        });

        const savedJobs = jobs?.filter(j => j.is_saved) || [];
        const appliedApps = apps?.filter(a => a.status === 'applied') || [];
        const interviewApps = apps?.filter(a => a.status === 'interview') || [];
        const offerApps = apps?.filter(a => a.status === 'offer') || [];

        // Find maximum match score
        const allScores = [
          ...(jobs?.map(j => j.match_score).filter(Boolean) as number[]),
          ...(apps?.map(a => {
            const jobObj = a.job as any;
            return jobObj ? jobObj.match_score : null;
          }).filter(Boolean) as number[])
        ];
        const bestMatch = allScores.length > 0 ? Math.max(...allScores) : 0;
        const qualifyCount = allScores.filter(s => s >= 75).length;

        setStats({
          savedCount: savedJobs.length,
          appliedCount: appliedApps.length,
          interviewCount: interviewApps.length,
          offerCount: offerApps.length,
          bestMatch,
          resumeStrength: strength,
          qualifyCount,
          topMissingSkill,
        });

        // Load recommended jobs based on target roles
        const targetRoles = profile?.preferences?.target_roles || ['Developer'];
        const keyword = targetRoles.length > 0 ? targetRoles[0] : 'Developer';

        // Retrieve Adzuna recommendation matches
        const res = await fetch(`/api/jobs?query=${encodeURIComponent(keyword)}`);
        const jobsList = await res.json();
        
        if (jobsList && jobsList.results) {
          const savedList = jobs || [];
          const sliced = jobsList.results.slice(0, 3).map((j: any) => {
            const matchedDb = savedList.find(
              (dbJob) => 
                dbJob.source_url === j.source_url || 
                (dbJob.title.toLowerCase() === j.title.toLowerCase() && 
                 dbJob.company.toLowerCase() === j.company.toLowerCase())
            );
            
            return {
              id: matchedDb ? matchedDb.id : j.id,
              title: j.title,
              company: j.company,
              location: j.location,
              match_score: matchedDb ? matchedDb.match_score : null,
              is_saved: matchedDb ? matchedDb.is_saved : false,
              db_id: matchedDb ? matchedDb.id : null,
              source_url: j.source_url,
              description: j.description,
            };
          });
          setRecommendations(sliced);
        }

      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [supabase]);

  const navigateToJob = async (job: RecommendedJob) => {
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
            description: job.description || '',
            source_url: job.source_url || '',
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

  const getCompanyAvatarStyle = (companyName: string) => {
    const firstChar = (companyName || 'C').charAt(0).toUpperCase();
    const colors = [
      { bg: 'bg-accent-primary/25', text: 'text-accent-primary' },
      { bg: 'bg-accent-green/25', text: 'text-accent-green' },
      { bg: 'bg-accent-amber/25', text: 'text-accent-amber' },
      { bg: 'bg-blue-500/25', text: 'text-blue-400' },
      { bg: 'bg-rose-500/25', text: 'text-rose-400' }
    ];
    const index = firstChar.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Generate date grid for GitHub activity heatmap (last 28 days)
  const getHeatmapGrid = () => {
    const dates = [];
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = heatmapData[dateStr] || 0;
      dates.push({ dateStr, date: d, count });
    }
    return dates;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  const heatmapGrid = getHeatmapGrid();

  return (
    <div 
      className="space-y-8 min-h-full"
      style={{
        backgroundImage: 'radial-gradient(ellipse 600px 400px at 10% 20%, rgba(124,92,252,0.06) 0%, transparent 70%)',
      }}
    >
      {/* 2-Column Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-base pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-[13px] mt-1 font-medium">Real-time telemetry synced · Active session verified</p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center justify-center px-4 h-[34px] bg-accent-primary hover:bg-accent-primary/90 text-text-primary text-[14px] font-semibold rounded-[6px] transition-all"
        >
          Discover Matches →
        </Link>
      </div>

      {/* Aggregate Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: New Matches */}
        <div className="bg-bg-surface border border-border-base rounded p-5 relative overflow-hidden flex flex-col justify-between h-[110px]">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">New Matches</span>
          <span className="text-3xl font-bold text-text-primary tracking-tight font-mono">
            <AnimatedCounter value={stats.qualifyCount} />
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent-primary"></div>
        </div>

        {/* Card 2: Resume Strength */}
        <div className="bg-bg-surface border border-border-base rounded p-5 relative overflow-hidden flex flex-col justify-between h-[110px]">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] block">Resume Strength</span>
            <div className="w-full h-[2px] bg-border-base rounded-full overflow-hidden">
              <div className="h-full bg-accent-primary transition-all duration-500" style={{ width: `${stats.resumeStrength}%` }}></div>
            </div>
          </div>
          <span className="text-3xl font-bold text-text-primary tracking-tight font-mono">
            <AnimatedCounter value={stats.resumeStrength} suffix="%" />
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent-green"></div>
        </div>

        {/* Card 3: Applications Awaiting */}
        <div className="bg-bg-surface border border-border-base rounded p-5 relative overflow-hidden flex flex-col justify-between h-[110px]">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Applications Awaiting</span>
          <span className="text-3xl font-bold text-text-primary tracking-tight font-mono">
            <AnimatedCounter value={stats.appliedCount} />
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-text-tertiary"></div>
        </div>

        {/* Card 4: Interviews Scheduled */}
        <div className="bg-bg-surface border border-border-base rounded p-5 relative overflow-hidden flex flex-col justify-between h-[110px]">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Interviews Scheduled</span>
          <span className="text-3xl font-bold text-text-primary tracking-tight font-mono">
            <AnimatedCounter value={stats.interviewCount} />
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent-amber"></div>
        </div>
      </div>

      {/* Main split content: Insights, Heatmap, Links & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column (2/3 width) - Insights & Activity Heatmap */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI INSIGHTS PANEL */}
          <div className="bg-bg-surface border border-border-base rounded p-6 space-y-4">
            <h3 className="font-semibold text-text-secondary text-[13px] uppercase tracking-[0.08em]">
              Insights
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-bg-elevated border border-border-base rounded space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Eligibility Threshold</span>
                <p className="text-sm font-medium text-text-primary">
                  You qualify for <span className="text-accent-primary font-bold font-mono">{stats.qualifyCount}</span> jobs in target pool.
                </p>
              </div>

              <div className="p-4 bg-bg-elevated border border-border-base rounded space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Highest Match Rating</span>
                <p className="text-sm font-medium text-text-primary">
                  Your best match score: <span className="text-accent-green font-bold font-mono">{stats.bestMatch}%</span> Fit
                </p>
              </div>
            </div>

            {stats.topMissingSkill && (
              <div className="p-4 border-l-3 border-accent-amber bg-accent-amber/[0.05] rounded-[4px] flex items-start gap-3 text-[13px] text-text-primary leading-relaxed">
                <div>
                  Keyword gap detected: <code className="font-mono text-accent-amber bg-accent-amber/[0.15] px-1.5 py-0.5 rounded border border-accent-amber/20">{stats.topMissingSkill}</code>. We recommend adding details about projects using this stack to boost your match scores this week.
                </div>
              </div>
            )}
          </div>

          {/* CAREER HEATMAP */}
          <div className="bg-bg-surface border border-border-base rounded p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-text-secondary text-[11px] uppercase tracking-[0.08em]">
                Applications Activity
              </h3>
              <span className="text-[10px] text-text-secondary font-bold font-mono">LAST 28 DAYS</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap py-2">
              {heatmapGrid.map((item, index) => {
                let colorClass = 'bg-bg-elevated text-text-tertiary';
                if (item.count === 1) colorClass = 'bg-accent-glow text-accent-primary border border-accent-primary/20';
                else if (item.count === 2) colorClass = 'bg-accent-primary/40 text-text-primary';
                else if (item.count >= 3) colorClass = 'bg-accent-primary text-text-primary';

                return (
                  <div
                    key={index}
                    title={`${item.dateStr}: ${item.count} applications`}
                    className={`w-8 h-8 rounded transition-colors cursor-pointer flex items-center justify-center text-[10px] font-bold font-mono ${colorClass}`}
                  >
                    {item.count > 0 ? item.count : ''}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] text-text-secondary font-bold uppercase pt-2 border-t border-border-base">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-bg-elevated rounded-sm"></span>
                <span className="w-3 h-3 bg-accent-glow rounded-sm border border-accent-primary/10"></span>
                <span className="w-3 h-3 bg-accent-primary/40 rounded-sm"></span>
                <span className="w-3 h-3 bg-accent-primary rounded-sm"></span>
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
        
        {/* Right Column (1/3 width) - Quick Links & Recommendations */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-bg-surface border border-border-base rounded p-6 space-y-4">
            <h3 className="font-semibold text-text-secondary text-[11px] uppercase tracking-[0.08em]">
              Quick Actions
            </h3>

            <div className="flex flex-col gap-3 text-[13px] font-medium">
              <Link
                href="/resume"
                className="text-accent-primary hover:underline flex items-center gap-1"
              >
                Edit Resume Vault →
              </Link>

              <Link
                href="/tracker"
                className="text-accent-primary hover:underline flex items-center gap-1"
              >
                Manage Kanban Board →
              </Link>
            </div>
          </div>

          {/* Top Recommendations */}
          <div className="bg-bg-surface border border-border-base rounded p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-text-secondary text-[11px] uppercase tracking-[0.08em]">
                Top Recommended
              </h3>
              <Link 
                href="/jobs" 
                className="text-xs font-semibold text-accent-primary hover:underline flex items-center gap-0.5"
              >
                All →
              </Link>
            </div>

            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <p className="text-text-tertiary text-xs italic text-center py-6">No recommended jobs found. Set preferences to load matching roles.</p>
              ) : (
                recommendations.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigateToJob(job)}
                    className="p-4 bg-bg-elevated border border-border-base rounded hover:border-border-highlight transition-all cursor-pointer flex justify-between items-center gap-3"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-8 h-8 rounded-[4px] shrink-0 font-mono font-bold flex items-center justify-center text-sm ${getCompanyAvatarStyle(job.company).bg} ${getCompanyAvatarStyle(job.company).text}`}>
                        {(job.company || 'CO').charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate space-y-0.5">
                        <h4 className="font-semibold text-text-primary text-[15px] leading-tight truncate">{job.title}</h4>
                        <p className="text-text-secondary text-xs truncate">{job.company} · {job.location}</p>
                      </div>
                    </div>
                    {job.match_score !== null && job.match_score !== undefined ? (
                      <span className="shrink-0 font-mono text-sm font-bold text-accent-green">
                        {job.match_score}%
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] uppercase font-bold text-accent-primary bg-accent-glow px-2 py-0.5 rounded-[4px]">
                        Analyze
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
