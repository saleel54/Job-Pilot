import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Verify Supabase Session JWT Token
async function verifySupabaseToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase project configuration is missing in backend env');
      return false;
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const userData = await response.json() as any;
      return !!userData && !!userData.id;
    }
    return false;
  } catch (err) {
    console.error('Token verification error:', err);
    return false;
  }
}

// Authentication Middleware
const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Access token is missing' });
  }

  const isValid = await verifySupabaseToken(token);
  if (!isValid) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired access token' });
  }

  next();
};

// Set up Multer for memory storage (file upload in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit to 5MB
  },
});

app.post('/api/parse-resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    // Extract text from PDF buffer
    let rawText = '';
    try {
      const parsedPdf = await pdfParse(req.file.buffer);
      rawText = parsedPdf.text;
    } catch (parseErr: any) {
      console.error('pdf-parse error:', parseErr);
      return res.status(400).json({ error: 'Failed to read PDF file content' });
    }

    if (!rawText.trim()) {
      return res.status(400).json({ error: 'Uploaded PDF file has no readable text' });
    }

    const userApiKey = req.headers['x-gemini-api-key'] as string;
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable or header is not set');
      return res.status(400).json({ error: 'AI parsing service API Key is missing. Please enter your Gemini API key.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Call Gemini 2.0 Flash to parse the raw text into structured JSON
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const systemPrompt = `You are JobPilot AI, an intelligent career assistant for fresh graduates and early-career developers in India.
Your task is to parse a raw resume text and extract structured information.
CRITICAL RULE: Extract ONLY what is present. Never invent, add, or imply any skill, experience, project, or education detail. If a detail is missing, leave it as an empty string, or empty array.
Return the result strictly as a JSON object with this structure:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "skills": ["string"],
  "experience": [
    { "role": "string", "company": "string", "duration": "string", "description": ["string"] }
  ],
  "projects": [
    { "name": "string", "description": "string", "technologies": ["string"] }
  ],
  "education": [
    { "degree": "string", "school": "string", "year": "string" }
  ]
}`;

    const prompt = `Here is the raw resume text:
---
${rawText}
---
Extract the details now.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    let profileData;
    try {
      profileData = JSON.parse(responseText);
    } catch (jsonErr) {
      console.error('Gemini output was not valid JSON:', responseText);
      // Retry once if Gemini output is invalid
      const retryResult = await model.generateContent([
        { text: systemPrompt },
        { text: `The previous response was not valid JSON. Please try again. Raw resume text:\n${rawText}` },
      ]);
      profileData = JSON.parse(retryResult.response.text());
    }

    return res.json({
      success: true,
      profile: profileData,
      raw_text: rawText,
    });
  } catch (err: any) {
    console.error('Error during resume parsing:', err);
    return res.status(500).json({
      error: 'An internal error occurred while parsing the resume: ' + err.message,
    });
  }
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
