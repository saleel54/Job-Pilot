'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Application {
  id: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  applied_at: string | null;
  notes: string;
  cover_letter: string;
  resume_version: any;
  status_history: { status: string; changed_at: string }[];
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    match_score: number;
  };
}

const COLUMNS = [
  { id: 'saved', name: 'Saved' },
  { id: 'applied', name: 'Applied' },
  { id: 'interview', name: 'Interview' },
  { id: 'offer', name: 'Offer' },
  { id: 'rejected', name: 'Rejected' },
] as const;

type StatusType = typeof COLUMNS[number]['id'];

export default function TrackerPage() {
  const supabase = createClient();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDragOverCol, setActiveDragOverCol] = useState<string | null>(null);
  
  // Side Panel state
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notesText, setNotesText] = useState('');
  const [activePanelTab, setActivePanelTab] = useState<'info' | 'docs' | 'timeline'>('info');

  // Move Modal / Prompt states
  const [showAppliedPrompt, setShowAppliedPrompt] = useState(false);
  const [promptAppId, setPromptAppId] = useState<string | null>(null);
  const [applyMethod, setApplyMethod] = useState('LinkedIn');
  const [applyDate, setApplyDate] = useState(new Date().toISOString().split('T')[0]);

  // Copy Follow-up text state
  const [copiedFollowupId, setCopiedFollowupId] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          applied_at,
          notes,
          cover_letter,
          resume_version,
          status_history,
          job:job_id (
            id,
            title,
            company,
            location,
            description,
            match_score
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setApplications(data as any[] || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [supabase]);

  // Native HTML5 Drag operations
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setActiveDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setActiveDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: StatusType) => {
    e.preventDefault();
    setActiveDragOverCol(null);
    const appId = e.dataTransfer.getData('text/plain');
    if (!appId) return;

    const currentApp = applications.find((app) => app.id === appId);
    if (!currentApp || currentApp.status === targetStatus) return;

    if (targetStatus === 'applied') {
      setPromptAppId(appId);
      setShowAppliedPrompt(true);
    } else {
      await updateApplicationStatus(appId, targetStatus);
    }
  };

  const updateApplicationStatus = async (appId: string, status: StatusType, extraData: any = {}) => {
    try {
      const currentApp = applications.find((app) => app.id === appId);
      if (!currentApp) return;

      const newHistory = [
        ...currentApp.status_history,
        { status, changed_at: new Date().toISOString() }
      ];

      const updatePayload: any = {
        status,
        status_history: newHistory,
        ...extraData
      };

      const { error } = await supabase
        .from('applications')
        .update(updatePayload)
        .eq('id', appId);

      if (error) throw error;

      setApplications(prev =>
        prev.map((app) =>
          app.id === appId
            ? { ...app, status, status_history: newHistory, ...extraData }
            : app
        )
      );

      if (selectedApp?.id === appId) {
        setSelectedApp((prev: any) => ({ ...prev, status, status_history: newHistory, ...extraData }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAppliedPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptAppId) return;

    await updateApplicationStatus(promptAppId, 'applied', {
      applied_at: new Date(applyDate).toISOString(),
      notes: `Applied via ${applyMethod}.\n\n`
    });

    setShowAppliedPrompt(false);
    setPromptAppId(null);
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    try {
      const { error } = await supabase
        .from('applications')
        .update({ notes: notesText })
        .eq('id', selectedApp.id);

      if (error) throw error;
      
      setApplications(prev =>
        prev.map((app) => app.id === selectedApp.id ? { ...app, notes: notesText } : app)
      );
      setSelectedApp(prev => prev ? { ...prev, notes: notesText } : null);
      alert('Notes saved successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  const getFollowUpList = () => {
    const now = new Date();
    return applications.filter((app) => {
      if (app.status !== 'applied' || !app.applied_at) return false;
      const appliedDate = new Date(app.applied_at);
      const diffTime = Math.abs(now.getTime() - appliedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 7;
    });
  };

  const followUps = getFollowUpList();

  const handleCopyFollowup = (app: Application) => {
    const msg = `Dear Hiring Manager,

I hope this message finds you well.

I am reaching out to check on the status of my application for the ${app.job.title} position at ${app.job.company}. I remain very interested in the role and believe my skills align well with your requirements.

Could you provide an update on the recruitment timeline?

Best regards,
[Your Name]`;
    navigator.clipboard.writeText(msg);
    setCopiedFollowupId(app.id);
    setTimeout(() => setCopiedFollowupId(null), 2500);
  };

  return (
    <div className="space-y-6 relative">
      <div className="border-b border-border-base pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Pipeline</h1>
        <p className="text-text-secondary text-[13px] mt-1 font-medium">Drag cards between stages · <span className="font-mono">{applications.length}</span> active</p>
      </div>

      {/* Follow-up Reminder Alerts */}
      {followUps.length > 0 && (
        <div className="space-y-3">
          {followUps.map((app) => (
            <div key={app.id} className="p-4 bg-accent-amber/[0.05] border border-accent-amber/20 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="font-bold text-accent-amber text-xs uppercase tracking-[0.08em]">Follow-up Required</h4>
                <p className="text-xs text-text-secondary mt-1">
                  It has been 7+ days since you applied to <span className="font-semibold text-text-primary">{app.job.company}</span> for <span className="font-semibold text-text-primary">{app.job.title}</span>.
                </p>
              </div>
              <button
                onClick={() => handleCopyFollowup(app)}
                className="px-3 py-1.5 bg-accent-amber text-bg-base hover:bg-accent-amber/90 rounded text-[11px] font-semibold transition-all uppercase tracking-wider shrink-0"
              >
                {copiedFollowupId === app.id ? 'Copied' : 'Copy Email Template'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KANBAN BOARD */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="bg-bg-surface border border-border-base rounded p-4 min-h-[300px] animate-pulse">
              <div className="h-3 bg-bg-elevated rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                <div className="h-14 bg-bg-elevated rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colApps = applications.filter((app) => app.status === col.id);
            const isHovered = activeDragOverCol === col.id;
            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`bg-bg-surface border rounded p-4 min-h-[500px] flex flex-col gap-4 transition-all duration-200 ${
                  isHovered 
                    ? 'border-accent-primary ring-1 ring-accent-primary/20 bg-bg-elevated' 
                    : 'border-border-base'
                }`}
              >
                {/* Column Title */}
                <div className="flex justify-between items-center border-b border-border-base pb-2">
                  <span className="font-bold text-text-secondary text-[10px] uppercase tracking-[0.08em]">{col.name}</span>
                  <span className="text-[10px] font-bold bg-bg-elevated text-text-tertiary px-1.5 py-0.5 rounded font-mono">
                    {colApps.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
                  {colApps.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-8">
                      <p className="text-[12px] text-text-tertiary">No cards</p>
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => {
                          setSelectedApp(app);
                          setNotesText(app.notes || '');
                          setActivePanelTab('info');
                        }}
                        className="bg-bg-elevated border border-border-base rounded p-4 hover:border-border-highlight transition-all cursor-pointer select-none space-y-2 relative group"
                      >
                        <div>
                          <h4 className="font-semibold text-text-primary text-xs truncate group-hover:text-accent-primary transition-colors">
                            {app.job.title}
                          </h4>
                          <p className="text-[10px] font-bold text-text-secondary truncate mt-0.5">{app.job.company}</p>
                        </div>

                        <div className="flex justify-between items-center text-[9px] text-text-secondary font-semibold pt-1 border-t border-border-base">
                          <span className="font-mono">
                            {app.applied_at 
                              ? new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) 
                              : 'SAVED'}
                          </span>
                          
                          {app.job.match_score && (
                            <span className="text-accent-green font-bold font-mono">
                              {app.job.match_score}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* APPLIED DIALOG POPUP */}
      {showAppliedPrompt && (
        <div className="fixed inset-0 bg-bg-base/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-bg-surface border border-border-base rounded p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-text-primary text-base">Log Application Details</h3>
            <p className="text-xs text-text-secondary">Provide details for this job application. This helps us optimize insights.</p>

            <form onSubmit={handleAppliedPromptSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1">Date Applied</label>
                <input
                  type="date"
                  required
                  value={applyDate}
                  onChange={(e) => setApplyDate(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1">Application Method</label>
                <select
                  value={applyMethod}
                  onChange={(e) => setApplyMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-border-highlight"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Company Portal">Company Portal</option>
                  <option value="Naukri">Naukri / Job Board</option>
                  <option value="Cold Email">Cold Email / Outreach</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAppliedPrompt(false);
                    setPromptAppId(null);
                  }}
                  className="flex-1 py-2 border border-border-base text-text-secondary rounded-[6px] text-xs font-semibold hover:bg-bg-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-accent-primary text-text-primary rounded-[6px] text-xs font-semibold hover:bg-accent-primary/95 transition-all"
                >
                  Log Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL OVERLAY SLIDE PANEL */}
      {selectedApp && (
        <div className="fixed inset-0 bg-bg-base/40 z-50 flex justify-end">
          <div className="w-full max-w-lg bg-bg-surface h-full flex flex-col animate-slide-in relative border-l border-border-base">
            {/* Close button */}
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 left-4 p-1 rounded hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
            >
              <span className="text-xs font-bold font-mono">CLOSE</span>
            </button>

            {/* Panel Header */}
            <div className="p-6 pt-12 border-b border-border-base">
              <span className="text-[10px] font-bold text-accent-primary bg-accent-glow px-2 py-0.5 rounded font-mono uppercase">
                {selectedApp.status}
              </span>
              <h2 className="text-lg font-bold text-text-primary mt-2 leading-tight">{selectedApp.job.title}</h2>
              <p className="text-xs text-text-secondary font-medium mt-1">{selectedApp.job.company} · {selectedApp.job.location}</p>
            </div>

            {/* Panel Tabs */}
            <div className="flex border-b border-border-base px-6 text-xs font-semibold">
              <button
                className={`py-3 mr-4 border-b-2 transition-all ${
                  activePanelTab === 'info' ? 'border-accent-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => setActivePanelTab('info')}
              >
                Notes & Description
              </button>
              <button
                className={`py-3 mr-4 border-b-2 transition-all ${
                  activePanelTab === 'docs' ? 'border-accent-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => setActivePanelTab('docs')}
              >
                Documents
              </button>
              <button
                className={`py-3 border-b-2 transition-all ${
                  activePanelTab === 'timeline' ? 'border-accent-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => setActivePanelTab('timeline')}
              >
                Timeline
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activePanelTab === 'info' && (
                <div className="space-y-6">
                  {/* Notes Editor */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Application Notes</label>
                      <button
                        onClick={handleSaveNotes}
                        className="text-[10px] bg-accent-primary text-text-primary px-2.5 py-1 rounded-[4px] font-semibold hover:bg-accent-primary/95 transition-all"
                      >
                        Save
                      </button>
                    </div>
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add reminders, interviewer names, key dates..."
                      className="w-full p-2.5 bg-bg-elevated border border-border-base rounded-[6px] text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-highlight h-28 leading-relaxed"
                    />
                  </div>

                  {/* JD Text */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] block">Job Description</label>
                    <div className="p-3 border border-border-base rounded bg-bg-elevated text-xs text-text-secondary leading-relaxed max-h-56 overflow-y-auto font-mono whitespace-pre-wrap">
                      {selectedApp.job.description}
                    </div>
                  </div>
                </div>
              )}

              {activePanelTab === 'docs' && (
                <div className="space-y-6">
                  {/* Resume Used */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">
                      Resume Version Used
                    </h4>
                    {selectedApp.resume_version ? (
                      <div className="p-3 border border-border-base rounded bg-bg-elevated text-xs space-y-2">
                        <p className="font-bold text-text-primary">Skills Snapshot:</p>
                        <p className="text-text-secondary leading-relaxed">{selectedApp.resume_version.skills?.join(', ') || 'None'}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-text-tertiary italic">No resume snapshot saved for this application.</p>
                    )}
                  </div>

                  {/* Cover Letter Used */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">
                      Cover Letter Used
                    </h4>
                    {selectedApp.cover_letter ? (
                      <div className="p-3 border border-border-base rounded bg-bg-elevated text-xs text-text-secondary whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                        {selectedApp.cover_letter}
                      </div>
                    ) : (
                      <p className="text-xs text-text-tertiary italic">No cover letter drafted for this application.</p>
                    )}
                  </div>
                </div>
              )}

              {activePanelTab === 'timeline' && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em]">Status History</h4>
                  <div className="relative border-l border-border-base pl-4 space-y-4 py-2 ml-2">
                    {selectedApp.status_history?.map((hist: any, index: number) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-accent-primary border-2 border-bg-surface" />
                        <div>
                          <p className="text-xs font-bold text-text-primary capitalize">{hist.status}</p>
                          <p className="text-[10px] text-text-secondary font-mono mt-0.5">
                            {new Date(hist.changed_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
