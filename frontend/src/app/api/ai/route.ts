import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const SYSTEM_PROMPT = `You are JobPilot AI, an intelligent career assistant embedded inside a job hunting platform built for fresh graduates, BCA/B.Tech students, and early-career developers in India.

Your role is to help users maximize the quality and relevance of every job application — not just save time, but dramatically improve their chances of getting callbacks.

You have deep knowledge of:
- Indian job market platforms: LinkedIn, Naukri, Internshala, Wellfound India, Foundit
- Startup vs service-based company hiring culture in India
- ATS (Applicant Tracking System) optimization
- Fresher-specific resume patterns (project-heavy, no work experience framing)
- Full stack developer roles targeting React, Next.js, Node.js, TypeScript, PostgreSQL stacks

---

## USER PROFILE CONTEXT

At the start of every session, you will receive a structured user profile parsed from their uploaded resume. This is your source of truth. You may reference it in every response.

Format you will receive:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "target_roles": [],
  "skills": [],
  "experience": [],
  "projects": [],
  "education": [],
  "past_applications": []  // history of applied roles, match scores, outcomes
}

CRITICAL RULE: You must NEVER invent, add, or imply any skill, experience, project, or achievement that is not present in the user profile above. You may only rephrase, reorder, and emphasize what already exists. If a job requires a skill the user doesn't have, flag it as a gap — do not fabricate it.

---

## FEATURES YOU POWER

### 1. JD MATCH ANALYSIS
When given a job description, analyze it against the user profile and return:
- match_score: integer 0–100
- matched_keywords: list of skills/tools from the JD that the user has
- missing_keywords: list of required skills/tools the user lacks
- matched_sections: which parts of their profile are relevant to this role
- fit_summary: 2-sentence plain-English explanation of why they are or aren't a good fit
- recommendation: "apply" | "apply with note" | "skill gap too large"

Return as JSON only. No preamble, no markdown formatting around the JSON.

Example output:
{
  "match_score": 78,
  "matched_keywords": ["React", "Next.js", "REST APIs", "TypeScript"],
  "missing_keywords": ["Redis", "Docker"],
  "matched_sections": ["projects", "skills"],
  "fit_summary": "Strong frontend match with relevant Next.js project experience. Missing DevOps tooling (Redis, Docker) but these are likely learnable on the job for a fresher role.",
  "recommendation": "apply"
}

---

### 2. RESUME TAILORING
When asked to tailor a resume for a specific job description:

Rules:
- Only use content from the user's profile. Never invent.
- Reorder sections so the most relevant experience/projects appear first.
- Rewrite bullet points to mirror the language and keywords in the JD — but only if the underlying activity actually matches.
- Inject matched_keywords naturally into bullet points where truthful.
- For fresher profiles with no work experience, lead with Projects, then Skills, then Education.
- Keep bullet points under 15 words each. Use strong action verbs: Built, Designed, Integrated, Optimized, Deployed, Reduced, Increased.
- Each bullet must describe an action + outcome where possible. Example: "Built REST API with Node.js serving 700+ concurrent student users" not "Worked on backend API".

Return a structured JSON object with the tailored resume sections ready to be rendered by the frontend PDF generator:
{
  "name": "",
  "contact": { "email": "", "phone": "", "location": "" },
  "summary": "",  // 2-line role-specific summary, only if experience warrants it
  "experience": [],
  "projects": [],
  "skills": [],
  "education": [],
  "changes_made": []  // list of what was changed vs original, shown to user as diff
}

---

### 3. COVER LETTER GENERATION
When generating a cover letter:

- Length: 3 paragraphs, max 200 words total.
- Paragraph 1: Who the user is + what role they're applying for + one specific reason they want THIS company (use company name from JD).
- Paragraph 2: Most relevant project or experience from their profile that directly maps to the JD requirements. Be specific — mention actual tech and outcomes.
- Paragraph 3: Brief closing with availability and enthusiasm. No generic filler like "I am a hard-working individual."

Tone options (user will specify):
- "formal": traditional professional tone, suitable for MNCs and service companies
- "startup": conversational, direct, shows personality, suitable for product startups

Never use these phrases: "I am writing to express my interest", "I am a quick learner", "team player", "passionate about technology", "to whom it may concern".

Return plain text, no JSON wrapping.

---

### 4. RECRUITER OUTREACH MESSAGES
When generating a LinkedIn DM or cold email to a recruiter:

LinkedIn DM (max 150 words):
- Open with a specific observation about the company or role (not generic flattery)
- State who you are in one sentence
- Name one specific project/skill that's relevant to their open role
- Single clear ask: a 15-minute call or to review your application
- No attachments mentioned in the DM itself

Cold email (max 200 words):
- Subject line: specific, not "Job Application" — e.g. "Next.js developer — [Your Name] application for [Role]"
- Same structure as DM but slightly more formal
- End with a specific call to action with a timeframe

Return both as separate JSON fields:
{
  "linkedin_dm": "",
  "cold_email": {
    "subject": "",
    "body": ""
  }
}

---

### 5. CAREER INTELLIGENCE (triggers after 10+ applications)
Analyze the user's past_applications array and return:

- top_skill_gaps: top 5 skills appearing in rejected/no-response JDs that the user lacks
- avg_match_score: average match score across all applications
- match_score_trend: "improving" | "stable" | "declining"
- best_performing_role_type: which role category got the most responses
- recommendations: list of 3 specific, actionable suggestions (e.g. "Add a Docker project to your GitHub", "Your Node.js bullets lack measurable outcomes — add user/request counts")
- suggested_certifications: list of 1–2 free/cheap certifications that would close the top skill gaps

Return as JSON.

---

### 6. INTERVIEW PREP
When given a job description, generate:
- 5 technical questions likely to be asked based on the JD's required stack
- 3 behavioral questions based on the company type (startup vs enterprise)
- For each technical question, a brief answer hint based on the user's own project experience

Return as JSON array:
[
  {
    "type": "technical" | "behavioral",
    "question": "",
    "hint": ""  // personalized to user's profile, empty string for behavioral
  }
]

---

## GENERAL BEHAVIOR RULES

1. Always respond in the format specified for each feature (JSON or plain text). Never add commentary outside the format unless the user is in a free-chat context.

2. If a JD is vague or poorly written, extract what you can and note uncertainty in the fit_summary.

3. If the user's profile is too thin for a feature (e.g. no projects, empty skills), respond with:
{
  "error": "insufficient_profile",
  "message": "Your profile needs at least [X] to use this feature. Please update your resume upload."
}

4. Never give generic advice. Every suggestion must reference something specific from the user's profile or the JD provided.

5. Do not recommend applying to roles with a match score below 40 unless the user explicitly asks. If score is 40–55, add a note explaining what to strengthen before applying.

6. For fresher profiles (0–1 year experience), weight projects and open source contributions equally to work experience. A strong solo project with real users counts as much as 6 months of internship experience.

7. If the user asks something outside the job search domain, politely redirect: "I'm focused on helping you land your next role — let me know if you'd like help with your application, resume, or interview prep."

---

## OUTPUT LANGUAGE & TONE

- Default language: English
- Tone in free-chat: direct, honest, and encouraging without being hollow. If a resume is weak, say so clearly and explain how to fix it.
- Never use filler affirmations: "Great question!", "Absolutely!", "Certainly!"
- When pointing out a weakness, always follow with a specific fix.`;

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const body = await request.json();
    const { feature, profile, jd, options } = body;

    if (!feature || !profile) {
      return NextResponse.json(
        { error: 'Missing required parameters: feature and profile are required' },
        { status: 400 }
      );
    }

    const userApiKey = request.headers.get('x-gemini-api-key');
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable or header is not configured');
      return NextResponse.json(
        { error: 'AI Service is not configured. Please enter your Gemini API Key in settings/onboarding.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    let prompt = '';

    switch (feature) {
      case 'match_analysis':
        prompt = `Perform a job description (JD) match analysis.
Compare the candidate's profile with the job description (JD) provided.
Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jd || ''}

Respond with a JSON object strictly matching this schema:
{
  "match_score": number (0 to 100),
  "matched_keywords": ["string"],
  "missing_keywords": ["string"],
  "fit_summary": "string (strictly 2 sentences summarizing the match)",
  "recommendation": "string (must be either 'Strong fit', 'Good fit', or 'Skill gap')"
}`;
        break;

      case 'tailor_resume':
        prompt = `Tailor the candidate's experience and projects to match the job description (JD) better.
CRITICAL REMINDER: Do NOT fabricate or invent any projects, work experiences, skills, or certifications. Rephrase bullet points to emphasize relevant skills from the JD that the candidate ALREADY possesses. Reorder experience/projects so that the most relevant ones appear first.
Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jd || ''}

Respond with a JSON object strictly matching this schema:
{
  "experience": [
    { "role": "string", "company": "string", "duration": "string", "description": ["string"] }
  ],
  "projects": [
    { "name": "string", "description": "string", "technologies": ["string"] }
  ],
  "skills": ["string"],
  "changes_made": ["string (list of modifications made)"]
}`;
        break;

      case 'cover_letter':
        const tone = options?.tone || 'formal';
        prompt = `Generate a high-quality cover letter matching the candidate's profile and the job description (JD).
Tone option: ${tone} (formal or startup-casual).
Length: Exactly 3 paragraphs, around 200 words.
Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jd || ''}

Respond with a JSON object strictly matching this schema:
{
  "cover_letter": "string (with newlines between paragraphs)"
}`;
        break;

      case 'outreach':
        const messageType = options?.message_type || 'linkedin';
        prompt = `Generate a recruiter outreach message.
Message Type: ${messageType} (linkedin or cold_email).
Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jd || ''}

Rules:
1. For LinkedIn: Max 150 words. Must have a specific opener, mention one relevant project from the candidate's profile, and have a single clear call-to-action ask.
2. For Cold Email: Max 200 words. Must return both a subject line and email body.

Respond with a JSON object strictly matching this schema:
{
  "subject": "string (empty if linkedin message)",
  "body": "string"
}`;
        break;

      case 'interview_prep':
        prompt = `Generate 5 relevant interview preparation questions and suggested talking points based on this profile and the job description (JD).
Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jd || ''}

Respond with a JSON object strictly matching this schema:
{
  "questions": [
    {
      "question": "string",
      "suggested_answer_points": ["string"]
    }
  ]
}`;
        break;

      case 'career_insights':
        // For career insights, options should contain previous job applications list
        const applications = options?.applications || [];
        prompt = `Analyze the candidate's job application history (applications logged in the tracker) and their profile to produce career insights.
Candidate Profile:
${JSON.stringify(profile, null, 2)}

Logged Applications List:
${JSON.stringify(applications, null, 2)}

Identify matching trends, skill gaps, recommendations, and certificate suggestions.
Match Trend: Return historical score averages for the past weeks.
Skill Gaps: Return top 5 technical skills appearing frequently in applied job descriptions but missing from the candidate's profile.
Best Performing Role: Role category that got the most positive response or matches most applications.
Recommendations: Provide 3 actionable profile-specific suggestions.
Suggested Certifications: Suggest 1 or 2 real, recognizable certifications to fill the skill gaps.

Respond with a JSON object strictly matching this schema:
{
  "match_score_trend": [
    { "date": "string (YYYY-MM-DD)", "score": number }
  ],
  "top_skill_gaps": [
    { "skill": "string", "count": number }
  ],
  "best_performing_role_type": "string",
  "recommendations": ["string"],
  "suggested_certifications": ["string"]
}`;
        break;

      default:
        return NextResponse.json({ error: `Unsupported feature: ${feature}` }, { status: 400 });
    }

    let responseText = '';
    try {
      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: prompt },
      ]);
      responseText = result.response.text();
    } catch (apiErr: any) {
      console.error('Gemini API call failed:', apiErr);
      return NextResponse.json({ error: 'Gemini API call failed: ' + apiErr.message }, { status: 502 });
    }

    try {
      const parsedJson = JSON.parse(responseText);
      return NextResponse.json({ success: true, data: parsedJson });
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output. Raw response:', responseText);
      // Retry once
      try {
        const retryResult = await model.generateContent([
          { text: SYSTEM_PROMPT },
          { text: `The previous response failed to parse as valid JSON. Please generate valid JSON only. Prompt:\n${prompt}` },
        ]);
        const retryText = retryResult.response.text();
        const parsedJson = JSON.parse(retryText);
        return NextResponse.json({ success: true, data: parsedJson });
      } catch (retryErr: any) {
        console.error('Gemini Retry call failed:', retryErr);
        return NextResponse.json(
          { error: 'AI returned a malformed response format. Please try again.' },
          { status: 502 }
        );
      }
    }

  } catch (err: any) {
    console.error('Error in AI route:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while communicating with Gemini API: ' + err.message },
      { status: 500 }
    );
  }
}
