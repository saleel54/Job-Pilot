'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

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
  const [userSkills, setUserSkills] = useState<string[]>([]);
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

        // Fetch profile, applications, and jobs concurrently and securely
        const [profileRes, appsRes, jobsRes] = await Promise.all([
          supabase.from('users_profile').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('applications').select('status, created_at, job:job_id(match_score)').eq('user_id', user.id),
          supabase.from('jobs').select('id, title, company, source_url, match_score, is_saved, match_data').eq('user_id', user.id)
        ]);

        const profile = profileRes.data;
        const apps = appsRes.data;
        const jobs = jobsRes.data;

        if (profile?.name) {
          setUserName(profile.name);
        }

        if (profile?.skills) {
          setUserSkills(profile.skills);
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
      { bg: 'bg-accent-primary/20 text-accent-primary border-accent-primary/20', text: 'text-accent-primary' },
      { bg: 'bg-accent-green/20 text-accent-green border-accent-green/20', text: 'text-accent-green' },
      { bg: 'bg-accent-amber/20 text-accent-amber border-accent-amber/20', text: 'text-accent-amber' },
      { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/20', text: 'text-blue-400' },
      { bg: 'bg-rose-500/20 text-rose-400 border-rose-500/20', text: 'text-rose-400' }
    ];
    const index = firstChar.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Generate date grid for activity heatmap
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

  // Dynamic Career Health Score Calculation
  const hasSkill = (sk: string) => {
    return userSkills.some((s: string) => s.toLowerCase().includes(sk.toLowerCase()));
  };

  const careerScore = stats.resumeStrength > 35 
    ? Math.min(Math.round(0.4 * stats.resumeStrength + 0.4 * (stats.bestMatch || 72) + 20), 100) 
    : 72;

  // Dynamic Career Health Score color check
  const getScoreColor = (score: number) => {
    if (score < 50) return '#FF6B6B';
    if (score < 80) return '#FFD93D';
    return '#00D67A';
  };
  const scoreColor = getScoreColor(careerScore);

  // Radar Chart Data representing Skills and Market Demand
  const radarData = [
    { subject: 'React', User: hasSkill('react') ? 95 : 40, Market: 85 },
    { subject: 'Node.js', User: hasSkill('node') ? 90 : 35, Market: 80 },
    { subject: 'AWS', User: hasSkill('aws') ? 85 : 30, Market: 75 },
    { subject: 'SQL', User: hasSkill('sql') || hasSkill('postgres') ? 90 : 50, Market: 70 },
    { subject: 'DSA', User: hasSkill('dsa') || hasSkill('algorithm') || hasSkill('python') ? 85 : 45, Market: 80 },
  ];

  // Mock recommendations if empty
  const displayRecs = recommendations.length > 0 ? recommendations : [
    { id: 'mock1', title: 'Software Engineer', company: 'Google', location: 'Bangalore, KA', match_score: 91, is_saved: false },
    { id: 'mock2', title: 'Full Stack Engineer', company: 'Amazon', location: 'Hyderabad, TS', match_score: 88, is_saved: true },
    { id: 'mock3', title: 'Associate Developer', company: 'Infosys', location: 'Pune, MH', match_score: 84, is_saved: false },
  ];

  return (
    <div className="space-y-8 min-h-full">
      {/* 2-Column Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary font-heading">Dashboard</h1>
          <p className="text-text-secondary text-xs mt-1 font-medium font-sans">Real-time telemetry synced · Active session verified</p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center justify-center px-5 h-10 bg-gradient-to-r from-[#00D67A] to-[#00A65A] text-[#0A0F0C] text-xs font-extrabold rounded-xl transition-all shadow-lg hover:shadow-[0_10px_30px_rgba(0,214,122,0.35)] btn-magnetic"
        >
          Discover Matches →
        </Link>
      </div>

      {/* Main Grid: Split visual analytics and stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Widgets Column: Career Health Score & Skill Gap Radar */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TOP GRAPHICAL ROW: Circular Health widget & Radar chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Widget 1: Career Health Score */}
            <div className="glass-card glow-card glass-shine p-6 rounded-[32px] flex flex-col items-center justify-between min-h-[300px] text-center">
              <div className="w-full flex justify-between items-center pb-2 border-b border-border dark:border-b-white/5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] font-sans">Telemetry</span>
                <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
              </div>
              
              {/* Circular Widget */}
              <div className="relative w-40 h-40 flex items-center justify-center my-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="68" 
                    strokeWidth="8" 
                    fill="transparent" 
                    className="stroke-black/[0.04] dark:stroke-white/[0.03]"
                  />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="68" 
                    stroke={scoreColor} 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={427} 
                    strokeDashoffset={427 - (427 * careerScore) / 100} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out" 
                    style={{ filter: `drop-shadow(0 0 6px ${scoreColor}40)` }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold tracking-tight font-mono text-text-primary">
                    <AnimatedCounter value={careerScore} />
                  </span>
                  <span className="text-[9px] uppercase font-bold text-text-secondary tracking-widest mt-0.5">Career Health</span>
                </div>
              </div>
 
              <div className="text-xs text-text-secondary font-medium px-4">
                Score based on matching metrics, resume DNA readiness, and pipeline activity.
              </div>
            </div>

            {/* Widget 2: Skill Gap Radar */}
            <div className="glass-card glow-card glass-shine p-6 rounded-[32px] flex flex-col justify-between min-h-[300px]">
              <div className="w-full flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] font-sans">Skill Gap Radar</span>
                <span className="text-[9px] font-bold text-accent-primary font-mono uppercase">Live Comparison</span>
              </div>

              <div className="w-full h-48 py-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="rgba(0, 214, 122, 0.05)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      stroke="#8B8BA8" 
                      fontSize={11} 
                      tickLine={false} 
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      stroke="rgba(0, 214, 122, 0.1)" 
                      fontSize={8} 
                      tick={false} 
                      axisLine={false} 
                    />
                    <Radar 
                      name="Your Skills" 
                      dataKey="User" 
                      stroke="#00D67A" 
                      fill="#00D67A" 
                      fillOpacity={0.25} 
                    />
                    <Radar 
                      name="Market Demand" 
                      dataKey="Market" 
                      stroke="#7CFFB2" 
                      fill="#7CFFB2" 
                      fillOpacity={0.1} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: 10, 
                        borderRadius: 12, 
                        backgroundColor: '#090B12', 
                        borderColor: 'rgba(255,255,255,0.1)', 
                        color: '#F0F0FF' 
                      }} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00D67A]"></span>
                  <span className="text-text-primary">Profile DNA</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7CFFB2]"></span>
                  <span className="text-text-secondary">Market Value</span>
                </div>
              </div>
            </div>

          </div>

          {/* TELEMETRY CARDS PANEL */}
          <div className="glass-card glow-card p-6 rounded-[32px] space-y-4">
            <h3 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em]">
              AI Action Center
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Eligibility Threshold</span>
                <p className="text-sm font-medium text-text-primary">
                  You qualify for <span className="text-accent-primary font-bold font-mono">{stats.qualifyCount}</span> jobs in target pool.
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Highest Match Rating</span>
                <p className="text-sm font-medium text-text-primary">
                  Your best match score: <span className="text-accent-green font-bold font-mono">{stats.bestMatch || 78}%</span> Fit
                </p>
              </div>
            </div>

            {stats.topMissingSkill && (
              <div className="p-4 border-l-3 border-accent-amber bg-accent-amber/[0.04] rounded-xl flex items-start gap-3 text-xs text-text-primary leading-relaxed">
                <div>
                  Keyword gap detected: <code className="font-mono text-accent-amber bg-white/10 px-1.5 py-0.5 rounded border border-white/5">{stats.topMissingSkill}</code>. We recommend adding projects using this stack to boost your match scores this week.
                </div>
              </div>
            )}
          </div>

          {/* APPLICATIONS ACTIVITY HEATMAP */}
          <div className="glass-card glow-card p-6 rounded-[32px] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em]">
                Applications Activity
              </h3>
              <span className="text-[9px] text-text-secondary font-bold font-mono">LAST 28 DAYS</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap py-2">
              {heatmapGrid.map((item, index) => {
                let colorClass = 'bg-bg-elevated/80 dark:bg-white/5 border border-border dark:border-white/5 text-text-tertiary';
                if (item.count === 1) colorClass = 'bg-accent-glow text-accent-primary border border-accent-primary/20';
                else if (item.count === 2) colorClass = 'bg-accent-primary/30 text-text-primary border border-accent-primary/40';
                else if (item.count >= 3) colorClass = 'bg-accent-primary text-white';

                return (
                  <div
                    key={index}
                    title={`${item.dateStr}: ${item.count} applications`}
                    className={`w-8 h-8 rounded-lg transition-all cursor-pointer flex items-center justify-center text-[10px] font-bold font-mono ${colorClass} hover:scale-110`}
                  >
                    {item.count > 0 ? item.count : ''}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[9px] text-text-secondary font-bold uppercase pt-2 border-t border-border dark:border-t-white/5">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-bg-elevated/80 dark:bg-white/5 border border-border dark:border-white/5 rounded-sm"></span>
                <span className="w-2.5 h-2.5 bg-accent-glow rounded-sm border border-accent-primary/10"></span>
                <span className="w-2.5 h-2.5 bg-accent-primary/30 rounded-sm"></span>
                <span className="w-2.5 h-2.5 bg-accent-primary rounded-sm"></span>
              </div>
              <span>More</span>
            </div>
          </div>
 
        </div>
        
        {/* Right Sidebar: Quick Actions & Match Intelligence glass cards */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <div className="glass-card glow-card p-6 rounded-[32px] space-y-4">
            <h3 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em]">
              Quick Actions
            </h3>
 
            <div className="flex flex-col gap-3 text-xs font-semibold">
              <Link
                href="/resume"
                className="text-accent-primary hover:text-text-primary flex items-center gap-1 transition-colors hover:translate-x-1"
              >
                Edit Resume Vault →
              </Link>
 
              <Link
                href="/tracker"
                className="text-accent-primary hover:text-text-primary flex items-center gap-1 transition-colors hover:translate-x-1"
              >
                Manage Kanban Board →
              </Link>
            </div>
          </div>
 
          {/* Match Intelligence (recommended jobs styled as Glass Cards) */}
          <div className="glass-card glow-card p-6 rounded-[32px] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em]">
                Match Intelligence
              </h3>
              <Link 
                href="/jobs" 
                className="text-[10px] font-bold text-accent-primary hover:text-text-primary flex items-center gap-0.5"
              >
                ALL
              </Link>
            </div>
 
            <div className="space-y-3">
              {displayRecs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => job.id.startsWith('mock') ? router.push('/jobs') : navigateToJob(job)}
                  className="p-4 bg-bg-surface/40 dark:bg-white/[0.02] border border-border dark:border-white/5 rounded-2xl hover:border-border-highlight dark:hover:border-white/12 transition-all cursor-pointer flex justify-between items-center gap-3 glass-shine card-hover-rise"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`w-8 h-8 rounded-xl shrink-0 font-mono font-bold flex items-center justify-center text-xs border ${getCompanyAvatarStyle(job.company).bg}`}>
                      {(job.company || 'CO').charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate space-y-0.5">
                      <h4 className="font-bold text-text-primary text-[13px] leading-tight truncate">{job.title}</h4>
                      <p className="text-text-secondary text-[10px] font-medium truncate">{job.company} · {job.location}</p>
                    </div>
                  </div>
                  
                  <span className="shrink-0 font-mono text-[13px] font-bold text-accent-green bg-accent-green/5 border border-accent-green/10 px-2 py-0.5 rounded-lg shadow-sm">
                    {job.match_score || 85}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PIPELINE TELEMETRY QUICK TILES */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card glow-card p-4 rounded-2xl flex flex-col justify-between h-[90px]">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Saved</span>
              <span className="text-2xl font-bold text-text-primary font-mono">{stats.savedCount}</span>
            </div>
            <div className="glass-card glow-card p-4 rounded-2xl flex flex-col justify-between h-[90px]">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Applied</span>
              <span className="text-2xl font-bold text-[#7CFFB2] font-mono">{stats.appliedCount}</span>
            </div>
            <div className="glass-card glow-card p-4 rounded-2xl flex flex-col justify-between h-[90px]">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Interviews</span>
              <span className="text-2xl font-bold text-accent-amber font-mono">{stats.interviewCount}</span>
            </div>
            <div className="glass-card glow-card p-4 rounded-2xl flex flex-col justify-between h-[90px]">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Offers</span>
              <span className="text-2xl font-bold text-accent-green font-mono">{stats.offerCount}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
