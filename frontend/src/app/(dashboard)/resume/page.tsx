'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Trash2, 
  Plus, 
  RefreshCw, 
  Check, 
  Save,
  Dna,
  User,
  Brain,
  History,
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface Experience {
  role: string;
  company: string;
  duration: string;
  description: string[];
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
}

interface Education {
  degree: string;
  school: string;
  year: string;
}

interface Profile {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  preferences: {
    target_roles: string[];
    locations: string[];
    work_type: string;
    experience_level: string;
  };
}

const SECTIONS = [
  { id: 'dna', name: 'AI Resume DNA', emoji: '🧬' },
  { id: 'personal', name: 'Personal Details', emoji: '👤' },
  { id: 'skills', name: 'Skills Vault', emoji: '🧠' },
  { id: 'experience', name: 'Work Experience', emoji: '💼' },
  { id: 'projects', name: 'Projects', emoji: '🚀' },
  { id: 'education', name: 'Education', emoji: '🎓' },
  { id: 'preferences', name: 'Preferences', emoji: '⚙️' },
] as const;

type SectionType = typeof SECTIONS[number]['id'];

interface DnaRingProps {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentType<any>;
}

function DnaRing({ label, value, color, icon: Icon }: DnaRingProps) {
  const radius = 34;
  const strokeDash = 2 * Math.PI * radius; // ~213.6
  const ringColor = value < 50 ? '#FF6B6B' : value < 80 ? '#FFD93D' : '#00C16A';
  
  return (
    <div className="flex flex-col items-center space-y-3 p-5 bg-bg-surface/40 dark:bg-white/[0.02] border border-border dark:border-white/5 rounded-3xl hover:border-border-highlight dark:hover:border-white/12 transition-all duration-300 relative group glow-card">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="48" 
            cy="48" 
            r={radius} 
            strokeWidth="5" 
            fill="transparent" 
            className="stroke-black/[0.04] dark:stroke-white/[0.03]"
          />
          <circle 
            cx="48" 
            cy="48" 
            r={radius} 
            stroke={ringColor} 
            strokeWidth="5" 
            fill="transparent" 
            strokeDasharray={strokeDash} 
            strokeDashoffset={strokeDash - (strokeDash * value) / 100} 
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 text-text-secondary/50 group-hover:text-text-primary transition-colors" />
          <span className="text-lg font-extrabold text-text-primary font-mono mt-0.5">{value}%</span>
        </div>
      </div>
      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest text-center">{label}</span>
    </div>
  );
}

export default function ResumeVaultPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSec, setActiveSec] = useState<SectionType>('dna');

  // Resume upload states
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const [resumeUploadStatus, setResumeUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [resumeUploadMsg, setResumeUploadMsg] = useState('');

  // Multi-input temporary states
  const [newRole, setNewRole] = useState('');
  const [newLoc, setNewLoc] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('users_profile')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          setProfile({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            skills: data.skills || [],
            experience: data.experience || [],
            projects: data.projects || [],
            education: data.education || [],
            preferences: data.preferences || {
              target_roles: [],
              locations: [],
              work_type: 'remote',
              experience_level: 'fresher',
            },
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [supabase]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users_profile')
        .update({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          skills: profile.skills,
          experience: profile.experience,
          projects: profile.projects,
          education: profile.education,
          preferences: profile.preferences,
        })
        .eq('id', user.id);

      if (error) throw error;
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setResumeUploadStatus('error');
      setResumeUploadMsg('Only PDF resumes are supported.');
      return;
    }

    setResumeUploadStatus('uploading');
    setResumeUploadMsg('Parsing your resume with AI — this takes a few seconds...');

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

      // Update Supabase profile with parsed data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expired. Please log in again.');

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

      // Update local state with new parsed profile
      setProfile(prev => prev ? {
        ...prev,
        name: result.profile.name || prev.name,
        phone: result.profile.phone || prev.phone,
        location: result.profile.location || prev.location,
        skills: result.profile.skills || prev.skills,
        experience: result.profile.experience || prev.experience,
        projects: result.profile.projects || prev.projects,
        education: result.profile.education || prev.education,
      } : prev);

      setResumeUploadStatus('success');
      setResumeUploadMsg('Resume updated! Your AI profile has been refreshed successfully.');
      setTimeout(() => setResumeUploadStatus('idle'), 5000);
    } catch (err: any) {
      console.error('Resume upload error:', err);
      setResumeUploadStatus('error');
      setResumeUploadMsg(err.message || 'Failed to process resume. Please try again.');
    } finally {
      if (resumeFileRef.current) resumeFileRef.current.value = '';
    }
  };

  const addExperienceItem = () => {
    if (!profile) return;
    const newItem: Experience = { role: '', company: '', duration: '', description: [''] };
    setProfile({ ...profile, experience: [...profile.experience, newItem] });
  };

  const removeExperienceItem = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      experience: profile.experience.filter((_, idx) => idx !== index),
    });
  };

  const updateExperienceItem = (index: number, field: keyof Experience, value: any) => {
    if (!profile) return;
    const list = [...profile.experience];
    list[index] = { ...list[index], [field]: value };
    setProfile({ ...profile, experience: list });
  };

  const addProjectItem = () => {
    if (!profile) return;
    const newItem: Project = { name: '', description: '', technologies: [] };
    setProfile({ ...profile, projects: [...profile.projects, newItem] });
  };

  const removeProjectItem = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      projects: profile.projects.filter((_, idx) => idx !== index),
    });
  };

  const updateProjectItem = (index: number, field: keyof Project, value: any) => {
    if (!profile) return;
    const list = [...profile.projects];
    list[index] = { ...list[index], [field]: value };
    setProfile({ ...profile, projects: list });
  };

  const addEducationItem = () => {
    if (!profile) return;
    const newItem: Education = { degree: '', school: '', year: '' };
    setProfile({ ...profile, education: [...profile.education, newItem] });
  };

  const removeEducationItem = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      education: profile.education.filter((_, idx) => idx !== index),
    });
  };

  const updateEducationItem = (index: number, field: keyof Education, value: any) => {
    if (!profile) return;
    const list = [...profile.education];
    list[index] = { ...list[index], [field]: value };
    setProfile({ ...profile, education: list });
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border dark:border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary font-heading">Resume Vault</h1>
          <p className="text-text-secondary text-xs mt-1 font-medium font-sans">Manage your parsed core profile. This is the single source of truth for the AI matching engine.</p>
        </div>

        {activeSec !== 'dna' && (
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-5 bg-accent-primary hover:bg-accent-primary/95 text-white rounded-xl text-xs font-semibold shadow-lg shadow-accent-primary/20 transition-all disabled:opacity-50 btn-magnetic"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : savedSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* LEFT COLUMN: NAVIGATION LIST */}
        <div className="glass-card p-4 h-fit space-y-1.5 rounded-[24px]">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSec(sec.id)}
              className={`w-full flex items-center h-10 px-3.5 text-left rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeSec === sec.id 
                  ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20 scale-[1.01]' 
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary hover:translate-x-1'
              }`}
            >
              <span className="mr-2.5 text-sm">{sec.emoji}</span>
              <span>{sec.name}</span>
            </button>
          ))}
        </div>

        {/* RIGHT COLUMN: EDITOR PANEL (3/4 width) */}
        <div className="md:col-span-3 glass-card p-6 rounded-[24px]">
          
          {/* SECTION: AI RESUME DNA */}
          {activeSec === 'dna' && (
            <div className="space-y-8">
              <div>
                <h3 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border dark:border-b-white/5 pb-2 mb-6">AI Profile DNA</h3>
                
                {/* 4 Rings Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <DnaRing label="Technical Skills" value={85} color="#7C5CFF" icon={Brain} />
                  <DnaRing label="Communication" value={70} color="#00D4FF" icon={User} />
                  <DnaRing label="Leadership" value={90} color="#F59E0B" icon={Sparkles} />
                  <DnaRing label="ATS Readiness" value={95} color="#00FFAA" icon={Dna} />
                </div>
              </div>
 
              {/* Resume Timeline */}
              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center border-b border-border dark:border-b-white/5 pb-2">
                  <h4 className="font-extrabold text-text-secondary text-[10px] uppercase tracking-[0.08em]">Resume Timeline</h4>
                  <span className="text-[10px] font-bold text-accent-primary font-mono uppercase">Career Path</span>
                </div>
 
                <div className="relative border-l border-border dark:border-l-white/5 ml-4 pl-6 space-y-8 py-2">
                  {/* 2026 */}
                  <div className="relative group">
                    <div className="absolute -left-[30px] top-1.5 w-4.5 h-4.5 rounded-full bg-accent-green border-4 border-bg-base shadow-lg shadow-accent-green/50 animate-pulse transition-transform group-hover:scale-120" />
                    <div>
                      <span className="text-[10px] font-bold text-accent-green font-mono">2026</span>
                      <h5 className="font-bold text-text-primary text-sm mt-0.5">Built JobPilot AI</h5>
                      <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
                        Launched Indian market Career Automation Hub. Built fully optimized integrations with Gemini AI for resume bullet point mapping and cover letter drafting.
                      </p>
                    </div>
                  </div>
 
                  {/* 2025 */}
                  <div className="relative group">
                    <div className="absolute -left-[30px] top-1.5 w-4.5 h-4.5 rounded-full bg-accent-primary border-4 border-bg-base transition-transform group-hover:scale-120" />
                    <div>
                      <span className="text-[10px] font-bold text-accent-primary font-mono">2025</span>
                      <h5 className="font-bold text-text-primary text-sm mt-0.5">Built HireLens</h5>
                      <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
                        Engineered a lightweight visual ATS applicant tracking pipeline featuring real-time telemetry, keyword comparisons, and dashboard visualizations.
                      </p>
                    </div>
                  </div>
 
                  {/* 2024 */}
                  <div className="relative group">
                    <div className="absolute -left-[30px] top-1.5 w-4.5 h-4.5 rounded-full bg-accent-secondary border-4 border-bg-base transition-transform group-hover:scale-120" />
                    <div>
                      <span className="text-[10px] font-bold text-accent-secondary font-mono">2024</span>
                      <h5 className="font-bold text-text-primary text-sm mt-0.5">Built TruPix</h5>
                      <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
                        Developed an online image rendering SaaS with custom filters and edge optimizations. Successfully scaled backend endpoints to serve student developers.
                      </p>
                    </div>
                  </div>
 
                  {/* 2023 */}
                  <div className="relative group">
                    <div className="absolute -left-[30px] top-1.5 w-4.5 h-4.5 rounded-full bg-[#F59E0B] border-4 border-bg-base transition-transform group-hover:scale-120" />
                    <div>
                      <span className="text-[10px] font-bold text-[#F59E0B] font-mono">2023</span>
                      <h5 className="font-bold text-text-primary text-sm mt-0.5">Built Localynk</h5>
                      <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
                        Designed community platform solving local discovery challenges using lightweight SQL stores and TypeScript API modules.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Upload New Resume panel */}
              <div className="p-5 bg-bg-surface/40 dark:bg-white/[0.02] border border-border dark:border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-text-primary text-xs">Upload New Resume</h4>
                    <p className="text-[11px] text-text-secondary mt-0.5">Re-parse your profile from a new PDF to update AI matching data instantly.</p>
                  </div>
                  <input
                    ref={resumeFileRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="dna-resume-upload"
                  />
                  <label
                    htmlFor="dna-resume-upload"
                    className={`inline-flex items-center gap-1.5 h-8 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                      resumeUploadStatus === 'uploading'
                        ? 'bg-bg-elevated text-text-secondary cursor-not-allowed'
                        : 'bg-accent-primary hover:bg-accent-primary/95 text-white shadow-lg shadow-accent-primary/20'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {resumeUploadStatus === 'uploading' ? 'Uploading...' : 'Upload PDF'}
                  </label>
                </div>
                {resumeUploadStatus === 'uploading' && (
                  <div className="flex items-center gap-2 text-xs text-accent-primary">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-accent-primary"></div>
                    <span>{resumeUploadMsg}</span>
                  </div>
                )}
                {resumeUploadStatus === 'success' && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ {resumeUploadMsg}</p>
                )}
                {resumeUploadStatus === 'error' && (
                  <p className="text-xs text-rose-500 font-semibold">{resumeUploadMsg}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4 border-t border-border dark:border-t-white/5">
                <button
                  onClick={() => setActiveSec('personal')}
                  className="px-4 py-2 bg-bg-elevated/40 hover:bg-bg-elevated/80 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-semibold rounded-lg transition-all border border-border dark:border-white/5"
                >
                  Edit Profile Details
                </button>
                <button
                  onClick={() => setActiveSec('skills')}
                  className="px-4 py-2 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-xs font-semibold rounded-lg transition-all border border-accent-primary/20"
                >
                  Manage Skills Vault
                </button>
              </div>
            </div>
          )}

          {/* SECTION: PERSONAL DETAILS */}
          {activeSec === 'personal' && (
            <div className="space-y-4">
              <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border dark:border-b-white/5 pb-2 mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                  />
                </div>
              </div>
            </div>
          )}
 
          {/* SECTION: SKILLS VAULT */}
          {activeSec === 'skills' && (
            <div className="space-y-4">
              <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border dark:border-b-white/5 pb-2 mb-4">Skills Vault</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                List the technical keywords you know. Make sure to separate them with commas (e.g. React, Next.js, Node.js, Python, PostgreSQL).
              </p>
              <textarea
                value={profile.skills.join(', ')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                rows={8}
                className="w-full p-3 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-sans leading-relaxed font-medium"
              />
              <div className="flex flex-wrap gap-1.5 mt-4">
                {profile.skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-0.5 rounded-full bg-accent-glow text-accent-primary text-[10px] border border-accent-primary/20 font-mono font-bold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: WORK EXPERIENCE */}
          {activeSec === 'experience' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border dark:border-b-white/5 pb-2">
                <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em]">Work Experience</h3>
                <button
                  type="button"
                  onClick={addExperienceItem}
                  className="inline-flex items-center gap-1 text-[11px] text-accent-primary hover:underline font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Position
                </button>
              </div>
 
              {profile.experience.length === 0 ? (
                <p className="text-text-tertiary text-xs italic text-center py-6">No experience added. Click &quot;Add Position&quot; to begin.</p>
              ) : (
                <div className="space-y-6">
                  {profile.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 border border-border dark:border-white/5 rounded-2xl bg-bg-surface/30 dark:bg-white/[0.01] space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeExperienceItem(idx)}
                        className="absolute top-4 right-4 p-1 text-text-secondary hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
 
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-8">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Role Title</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => updateExperienceItem(idx, 'role', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperienceItem(idx, 'company', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Duration</label>
                          <input
                            type="text"
                            placeholder="e.g. May 2024 - Present"
                            value={exp.duration}
                            onChange={(e) => updateExperienceItem(idx, 'duration', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                          />
                        </div>
                      </div>
 
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Description (Bullets, comma separated)</label>
                        <textarea
                          rows={3}
                          value={exp.description?.join(', ') || ''}
                          onChange={(e) =>
                            updateExperienceItem(
                              idx,
                              'description',
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          className="w-full p-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-sans leading-relaxed font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
 
          {/* SECTION: PROJECTS */}
          {activeSec === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border dark:border-b-white/5 pb-2">
                <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em]">Projects</h3>
                <button
                  type="button"
                  onClick={addProjectItem}
                  className="inline-flex items-center gap-1 text-[11px] text-accent-primary hover:underline font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Project
                </button>
              </div>
 
              {profile.projects.length === 0 ? (
                <p className="text-text-tertiary text-xs italic text-center py-6">No projects added. Click &quot;Add Project&quot; to begin.</p>
              ) : (
                <div className="space-y-6">
                  {profile.projects.map((proj, idx) => (
                    <div key={idx} className="p-4 border border-border dark:border-white/5 rounded-2xl bg-bg-surface/30 dark:bg-white/[0.01] space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeProjectItem(idx)}
                        className="absolute top-4 right-4 p-1 text-text-secondary hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
 
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Project Name</label>
                          <input
                            type="text"
                            value={proj.name}
                            onChange={(e) => updateProjectItem(idx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Technologies (Comma separated)</label>
                          <input
                            type="text"
                            placeholder="React, Next.js, Firebase"
                            value={proj.technologies?.join(', ') || ''}
                            onChange={(e) =>
                              updateProjectItem(
                                idx,
                                'technologies',
                                e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                          />
                        </div>
                      </div>
 
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Project Description</label>
                        <textarea
                          rows={2}
                          value={proj.description}
                          onChange={(e) => updateProjectItem(idx, 'description', e.target.value)}
                          className="w-full p-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-sans leading-relaxed font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
 
          {/* SECTION: EDUCATION */}
          {activeSec === 'education' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border dark:border-b-white/5 pb-2">
                <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em]">Education</h3>
                <button
                  type="button"
                  onClick={addEducationItem}
                  className="inline-flex items-center gap-1 text-[11px] text-accent-primary hover:underline font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Education
                </button>
              </div>
 
              {profile.education.length === 0 ? (
                <p className="text-text-tertiary text-xs italic text-center py-6">No education history added. Click &quot;Add Education&quot; to begin.</p>
              ) : (
                <div className="space-y-6">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="p-4 border border-border dark:border-white/5 rounded-2xl bg-bg-surface/30 dark:bg-white/[0.01] space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeEducationItem(idx)}
                        className="absolute top-4 right-4 p-1 text-text-secondary hover:text-rose-455 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
 
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-8">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Degree / Course</label>
                          <input
                            type="text"
                            placeholder="e.g. B.Tech Computer Science"
                            value={edu.degree}
                            onChange={(e) => updateEducationItem(idx, 'degree', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">School / University</label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => updateEducationItem(idx, 'school', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Year of Graduation</label>
                          <input
                            type="text"
                            placeholder="e.g. 2025"
                            value={edu.year}
                            onChange={(e) => updateEducationItem(idx, 'year', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
 
          {/* SECTION: TARGET PREFERENCES */}
          {activeSec === 'preferences' && (
            <div className="space-y-6">
              <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border dark:border-b-white/5 pb-2 mb-4">Target Preferences</h3>
              
              {/* Target Roles */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Target Job Roles</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Full Stack Developer"
                    className="flex-1 px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newRole.trim() && !profile.preferences.target_roles.includes(newRole.trim())) {
                        setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            target_roles: [...profile.preferences.target_roles, newRole.trim()],
                          },
                        });
                        setNewRole('');
                      }
                    }}
                    className="px-4 h-9 bg-accent-primary text-white rounded-xl text-xs font-semibold hover:bg-accent-primary/95 transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.preferences.target_roles.map((role) => (
                    <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] bg-accent-glow text-accent-primary border border-accent-primary/20 font-mono font-bold">
                      {role}
                      <button
                        onClick={() =>
                          setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              target_roles: profile.preferences.target_roles.filter((r) => r !== role),
                            },
                          })
                        }
                        className="ml-1 text-accent-primary hover:text-text-primary"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
 
              {/* Locations */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Preferred Locations</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                    placeholder="e.g. Remote"
                    className="flex-1 px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newLoc.trim() && !profile.preferences.locations.includes(newLoc.trim())) {
                        setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            locations: [...profile.preferences.locations, newLoc.trim()],
                          },
                        });
                        setNewLoc('');
                      }
                    }}
                    className="px-4 h-9 bg-accent-primary text-white rounded-xl text-xs font-semibold hover:bg-accent-primary/95 transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.preferences.locations.map((loc) => (
                    <span key={loc} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 text-text-secondary font-mono font-bold">
                      {loc}
                      <button
                        onClick={() =>
                          setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              locations: profile.preferences.locations.filter((l) => l !== loc),
                            },
                          })
                        }
                        className="ml-1 text-text-secondary hover:text-text-primary"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
 
              {/* Work Type & Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Work Type</label>
                  <select
                    value={profile.preferences.work_type}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, work_type: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Experience Level</label>
                  <select
                    value={profile.preferences.experience_level}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, experience_level: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-elevated/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-highlight dark:focus:border-white/20 font-medium"
                  >
                    <option value="fresher">Fresher (0 - 1 year)</option>
                    <option value="1-2yr">1 - 2 years</option>
                    <option value="3-5yr">3 - 5 years</option>
                  </select>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
