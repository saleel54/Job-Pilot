'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Trash2, 
  Plus, 
  RefreshCw, 
  Check, 
  Save 
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
  { id: 'personal', name: 'Personal Details' },
  { id: 'skills', name: 'Skills Vault' },
  { id: 'experience', name: 'Work Experience' },
  { id: 'projects', name: 'Projects' },
  { id: 'education', name: 'Education' },
  { id: 'preferences', name: 'Preferences' },
] as const;

export default function ResumeVaultPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  const [activeSec, setActiveSec] = useState<'personal' | 'skills' | 'experience' | 'projects' | 'education' | 'preferences'>('personal');

  // Multi-input temporary states
  const [newRole, setNewRole] = useState('');
  const [newLoc, setNewLoc] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('users_profile')
          .select('*')
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-base pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Resume Vault</h1>
          <p className="text-text-secondary text-[13px] mt-1 font-medium font-sans">Manage your parsed core profile. This is the single source of truth for the AI matching engine.</p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-accent-primary hover:bg-accent-primary/95 text-text-primary rounded-[6px] text-xs font-semibold transition-all disabled:opacity-50"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* LEFT COLUMN: NAVIGATION LIST */}
        <div className="bg-bg-surface border border-border-base rounded p-4 h-fit space-y-1">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSec(sec.id)}
              className={`w-full flex items-center h-9 px-3 text-left rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                activeSec === sec.id 
                  ? 'bg-accent-glow text-accent-primary border-l-2 border-accent-primary pl-2.5' 
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              }`}
            >
              {sec.name}
            </button>
          ))}
        </div>

        {/* RIGHT COLUMN: EDITOR PANEL (3/4 width) */}
        <div className="md:col-span-3 bg-bg-surface border border-border-base rounded p-6">
          
          {/* SECTION 1: PERSONAL DETAILS */}
          {activeSec === 'personal' && (
            <div className="space-y-4">
              <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2 mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SKILLS VAULT */}
          {activeSec === 'skills' && (
            <div className="space-y-4">
              <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2 mb-4">Skills Vault</h3>
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
                className="w-full p-3 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-sans leading-relaxed font-medium"
              />
              <div className="flex flex-wrap gap-1.5 mt-4">
                {profile.skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-0.5 rounded-full bg-accent-glow text-accent-primary text-[10px] border border-accent-primary/25 font-mono font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: WORK EXPERIENCE */}
          {activeSec === 'experience' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border-base pb-2">
                <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em]">Work Experience</h3>
                <button
                  type="button"
                  onClick={addExperienceItem}
                  className="inline-flex items-center gap-1 text-[11px] text-accent-primary hover:underline font-semibold"
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
                    <div key={idx} className="p-4 border border-border-base rounded bg-bg-elevated/20 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeExperienceItem(idx)}
                        className="absolute top-4 right-4 p-1 text-text-secondary hover:text-rose-450 rounded transition-colors"
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
                            className="w-full px-2.5 py-1.5 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperienceItem(idx, 'company', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Duration</label>
                          <input
                            type="text"
                            placeholder="e.g. May 2024 - Present"
                            value={exp.duration}
                            onChange={(e) => updateExperienceItem(idx, 'duration', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
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
                          className="w-full p-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-sans leading-relaxed font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: PROJECTS */}
          {activeSec === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border-base pb-2">
                <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em]">Projects</h3>
                <button
                  type="button"
                  onClick={addProjectItem}
                  className="inline-flex items-center gap-1 text-[11px] text-accent-primary hover:underline font-semibold"
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
                    <div key={idx} className="p-4 border border-border-base rounded bg-bg-elevated/20 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeProjectItem(idx)}
                        className="absolute top-4 right-4 p-1 text-text-secondary hover:text-rose-455 rounded transition-colors"
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
                            className="w-full px-2.5 py-1.5 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
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
                            className="w-full px-2.5 py-1.5 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Project Description</label>
                        <textarea
                          rows={2}
                          value={proj.description}
                          onChange={(e) => updateProjectItem(idx, 'description', e.target.value)}
                          className="w-full p-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-sans leading-relaxed font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: EDUCATION */}
          {activeSec === 'education' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border-base pb-2">
                <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em]">Education</h3>
                <button
                  type="button"
                  onClick={addEducationItem}
                  className="inline-flex items-center gap-1 text-[11px] text-accent-primary hover:underline font-semibold"
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
                    <div key={idx} className="p-4 border border-border-base rounded bg-bg-elevated/20 space-y-3 relative">
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
                            className="w-full px-2.5 py-1.5 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">School / University</label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => updateEducationItem(idx, 'school', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Year of Graduation</label>
                          <input
                            type="text"
                            placeholder="e.g. 2025"
                            value={edu.year}
                            onChange={(e) => updateEducationItem(idx, 'year', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: TARGET PREFERENCES */}
          {activeSec === 'preferences' && (
            <div className="space-y-6">
              <h3 className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em] border-b border-border-base pb-2 mb-4">Target Preferences</h3>
              
              {/* Target Roles */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Target Job Roles</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Full Stack Developer"
                    className="flex-1 px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
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
                    className="px-4 h-9 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:bg-accent-primary/95 transition-all"
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
                    className="flex-1 px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
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
                    className="px-4 h-9 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:bg-accent-primary/95 transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.preferences.locations.map((loc) => (
                    <span key={loc} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] bg-bg-elevated text-text-secondary border border-border-base font-mono font-bold">
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
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
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
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight font-medium"
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
