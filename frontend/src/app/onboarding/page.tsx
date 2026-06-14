'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

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
}

const defaultProfile: Profile = {
  name: '',
  email: '',
  phone: '',
  location: '',
  skills: [],
  experience: [],
  projects: [],
  education: [],
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [rawResumeText, setRawResumeText] = useState('');
  const [userGeminiKey, setUserGeminiKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Preference setup states
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [workType, setWorkType] = useState('remote');
  const [experienceLevel, setExperienceLevel] = useState('fresher');

  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserGeminiKey(localStorage.getItem('user_gemini_api_key') || '');
    }

    // Check if user is authenticated and if they already have a profile
    async function checkAuthAndProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('users_profile')
        .select('id')
        .maybeSingle();

      if (existingProfile) {
        router.push('/dashboard');
      }
    }
    checkAuthAndProfile();
  }, [router, supabase]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMsg('Currently only PDF resumes are supported.');
      return;
    }

    setLoading(true);
    setUploadProgress(20);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      if (typeof window !== 'undefined' && userGeminiKey.trim()) {
        localStorage.setItem('user_gemini_api_key', userGeminiKey.trim());
      }

      // Connect to Express backend running locally or on production
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      setUploadProgress(40);
      
      const customKey = userGeminiKey.trim() || (typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') || '' : '');
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

      setUploadProgress(70);

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse resume.');
      }

      setProfile(result.profile);
      setRawResumeText(result.raw_text || '');
      setUploadProgress(100);
      
      // Auto move to edit profile step
      setTimeout(() => {
        setStep(3);
        setLoading(false);
      }, 500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while uploading. You can proceed with a blank profile.');
      setLoading(false);
    }
  };

  const handleManualSkip = () => {
    setProfile(defaultProfile);
    setStep(3);
  };

  const saveProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User session not found. Please log in again.');
      }

      // Prepare preferences payload
      const preferences = {
        target_roles: targetRoles,
        locations: preferredLocations,
        work_type: workType,
        experience_level: experienceLevel,
      };

      // Save to Supabase
      const { error } = await supabase.from('users_profile').insert({
        id: user.id,
        name: profile.name,
        email: profile.email || user.email || '',
        phone: profile.phone,
        location: profile.location,
        skills: profile.skills,
        experience: profile.experience,
        projects: profile.projects,
        education: profile.education,
        preferences: preferences,
        raw_resume_text: rawResumeText,
      });

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save profile configuration.');
      setLoading(false);
    }
  };

  // Helper arrays update
  const addTargetRole = () => {
    if (roleInput.trim() && !targetRoles.includes(roleInput.trim())) {
      setTargetRoles([...targetRoles, roleInput.trim()]);
      setRoleInput('');
    }
  };

  const removeTargetRole = (role: string) => {
    setTargetRoles(targetRoles.filter((r) => r !== role));
  };

  const addPreferredLocation = () => {
    if (locationInput.trim() && !preferredLocations.includes(locationInput.trim())) {
      setPreferredLocations([...preferredLocations, locationInput.trim()]);
      setLocationInput('');
    }
  };

  const removePreferredLocation = (loc: string) => {
    setPreferredLocations(preferredLocations.filter((l) => l !== loc));
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-accent-glow blur-3xl pointer-events-none"></div>
      
      <div className="max-w-3xl mx-auto">
        {/* Step Indicator Header */}
        <div className="mb-8 flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent-primary">Step {step} of 4</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-1 transition-colors duration-200 ${
                  s <= step ? 'bg-accent-primary' : 'bg-bg-elevated border border-border-base'
                }`}
              />
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 mb-6 text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-[6px]">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: GEMINI API KEY CONFIGURATION */}
        {step === 1 && (
          <div className="bg-bg-surface border border-border-base rounded-lg p-6 md:p-8 space-y-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Configure Gemini AI</h1>
              <p className="text-text-secondary text-xs leading-relaxed">
                To power your personalized resume tailoring, cover letter generation, and JD match analysis, JobPilot AI uses the Google Gemini API. 
              </p>
            </div>

            <div className="p-4 bg-accent-glow border border-accent-primary/20 rounded-[6px] space-y-2">
              <h3 className="font-bold text-accent-primary text-[10px] uppercase tracking-wider">Why do I need this?</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                We design JobPilot AI to run on your own key so you have **unlimited free usage** without shared rate limits. Your key is stored locally and securely on your own browser and is only sent directly to Google.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Step-by-step: How to get your free API key
                </label>
                <ol className="list-decimal list-inside text-xs text-text-secondary space-y-2 leading-relaxed bg-bg-elevated border border-border-base rounded-[6px] p-4">
                  <li>Go to <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-accent-primary font-bold hover:underline">Google AI Studio</a>.</li>
                  <li>Sign in with your Google account.</li>
                  <li>Click the blue **&quot;Get API Key&quot;** button in the top left.</li>
                  <li>Click **&quot;Create API Key&quot;** and copy the generated key (starts with <code className="font-mono bg-bg-surface px-1 py-0.5 rounded border border-border-base">AIzaSy</code>).</li>
                </ol>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
                  Enter your Gemini API Key
                </label>
                <input
                  type="password"
                  value={userGeminiKey}
                  onChange={(e) => setUserGeminiKey(e.target.value)}
                  placeholder="Paste your AIzaSy... key here"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] focus:outline-none focus:border-border-highlight transition-colors text-xs text-text-primary font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border-base">
              <button
                type="button"
                onClick={() => {
                  if (!userGeminiKey.trim()) {
                    setErrorMsg('Please enter a valid Gemini API Key to continue.');
                    return;
                  }
                  setErrorMsg('');
                  localStorage.setItem('user_gemini_api_key', userGeminiKey.trim());
                  setStep(2);
                }}
                className="px-4 py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:opacity-90 transition-colors"
              >
                Save & Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: RESUME UPLOAD */}
        {step === 2 && (
          <div className="bg-bg-surface border border-border-base rounded-lg p-6 md:p-8">
            <h1 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Let&apos;s build your AI Profile</h1>
            <p className="text-text-secondary mb-8 text-xs leading-relaxed">
              Upload your existing resume PDF. JobPilot AI will extract your experience, skills, and projects, setting up your matching engine in seconds.
            </p>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mb-4"></div>
                <h3 className="font-bold text-text-primary text-sm">JobPilot AI is reading your resume...</h3>
                <p className="text-text-secondary text-xs mt-1">Extracting experience, skills, and projects</p>
                <div className="w-64 bg-bg-elevated h-1 rounded-none border border-border-base mt-4 overflow-hidden">
                  <div
                    className="bg-accent-primary h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <label className="block border border-dashed border-border-base rounded-lg p-8 text-center hover:border-accent-primary transition-colors bg-bg-elevated/30 cursor-pointer">
                  <input
                    type="file"
                    className="sr-only"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                  />
                  <svg
                    className="mx-auto h-10 w-10 text-text-tertiary mb-3"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex justify-center text-xs text-text-secondary">
                    <span className="font-semibold text-accent-primary hover:underline">
                      Upload a PDF resume
                    </span>
                  </div>
                  <p className="text-[11px] text-text-tertiary mt-1">PDF file up to 5MB</p>
                </label>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border-base"></span>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono">
                    <span className="bg-bg-surface px-2 text-text-tertiary">Or start manually</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 border border-border-base text-text-secondary rounded-[6px] text-xs font-semibold bg-bg-elevated hover:bg-bg-surface transition-colors"
                  >
                    Back to API Key
                  </button>
                  <button
                    type="button"
                    onClick={handleManualSkip}
                    className="flex-1 py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:opacity-90 transition-colors"
                  >
                    Create Manually
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: EDIT PARSED PROFILE */}
        {step === 3 && (
          <div className="bg-bg-surface border border-border-base rounded-lg p-6 md:p-8 space-y-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Review your Profile</h1>
              <p className="text-text-secondary text-xs leading-relaxed">
                We read your resume. Please check, correct, or add any details to optimize matching accuracy.
              </p>
            </div>

            {/* Core Info */}
            <div className="space-y-4 border-t border-border-base pt-6">
              <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="e.g. Bangalore, India"
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-4 border-t border-border-base pt-6">
              <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">Skills</h3>
              <textarea
                value={profile.skills.join(', ')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="Comma separated skills, e.g. React, Next.js, Node.js"
                className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight min-h-[80px] leading-relaxed font-mono"
              />
            </div>

            {/* Save and Continue buttons */}
            <div className="flex justify-between border-t border-border-base pt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-border-base text-text-secondary bg-bg-elevated rounded-[6px] text-xs font-semibold hover:bg-bg-surface transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:opacity-90 transition-colors"
              >
                Continue to Preferences
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PREFERENCES & SAVE */}
        {step === 4 && (
          <div className="bg-bg-surface border border-border-base rounded-lg p-6 md:p-8 space-y-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Job Preferences</h1>
              <p className="text-text-secondary text-xs leading-relaxed">
                Define the roles and work formats you are looking for so we can match jobs correctly.
              </p>
            </div>

            {/* Target Roles */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">
                Target Job Roles
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTargetRole()}
                  placeholder="e.g. Frontend Developer"
                  className="flex-1 px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight"
                />
                <button
                  type="button"
                  onClick={addTargetRole}
                  className="px-4 py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:opacity-90"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {targetRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-mono font-semibold bg-accent-glow text-accent-primary border border-accent-primary/20"
                  >
                    {role}
                    <button
                      type="button"
                      onClick={() => removeTargetRole(role)}
                      className="ml-1.5 text-accent-primary/60 hover:text-accent-primary focus:outline-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">
                Preferred Locations
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPreferredLocation()}
                  placeholder="e.g. Bangalore"
                  className="flex-1 px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight"
                />
                <button
                  type="button"
                  onClick={addPreferredLocation}
                  className="px-4 py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:opacity-90"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {preferredLocations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-mono font-semibold bg-bg-elevated text-text-secondary border border-border-base"
                  >
                    {loc}
                    <button
                      type="button"
                      onClick={() => removePreferredLocation(loc)}
                      className="ml-1.5 text-text-secondary hover:text-text-primary focus:outline-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Work Type & Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
                  Work Type
                </label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight"
                >
                  <option value="fresher">Fresher (0 - 1 year)</option>
                  <option value="1-2yr">1 - 2 years</option>
                  <option value="3-5yr">3 - 5 years</option>
                </select>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-between border-t border-border-base pt-6">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-border-base text-text-secondary bg-bg-elevated rounded-[6px] text-xs font-semibold hover:bg-bg-surface transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={loading}
                className="px-4 py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:opacity-90 transition-colors flex items-center gap-1.5"
              >
                {loading && (
                  <svg className="animate-spin h-3.5 w-3.5 text-text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Complete Setup & Launch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
