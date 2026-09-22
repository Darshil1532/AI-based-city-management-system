import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// AI Service Status
app.get('/api/ai/status', (req, res) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  res.json({
    geminiConfigured: isConfigured,
    activeProvider: isConfigured ? 'Gemini' : 'Demo AI',
    model: isConfigured ? 'gemini-2.5-flash' : 'Rule-Based Municipal Expert System',
  });
});

// System Status
app.get('/api/system/status', (req, res) => {
  res.json({
    platform: 'AI-Based Smart City Management System',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  });
});

// Gemini Analysis Endpoint (Server-Side Decision Support)
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { description, userCategory, userSeverity, location } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        fallback: true,
        reason: 'GEMINI_API_KEY is not configured in server environment.',
      });
    }

    const prompt = `You are the municipal AI triage engine for a smart city administration.
Analyze the following citizen complaint and provide decision-support recommendations for the municipal administration.
AI provides decision support only; human city officials make all final decisions.

Citizen Report:
- Description: "${description || ''}"
- User-Selected Category: "${userCategory || 'Unspecified'}"
- User-Reported Severity: "${userSeverity || 'Medium'}"
- Location: "${location?.address || 'City Center'}" (Landmark: "${location?.landmark || 'None'}", District: "${location?.district || 'General'}")

Respond ONLY with a JSON object matching this schema:
{
  "category": "Pothole / Road" | "Garbage / Waste" | "Water Leakage" | "Streetlight" | "Traffic" | "Infrastructure" | "Other",
  "priority": "Low" | "Medium" | "High",
  "department": "Public Works Department" | "Sanitation Department" | "Water Supply Department" | "Electrical Department" | "Traffic & Transit Department" | "Urban Infrastructure Division",
  "confidence": number between 0.80 and 0.98,
  "reasoning": "A concise 2-sentence explanation of why this category, priority, and department are recommended based on civic factors and safety hazards.",
  "factors": ["Factor 1", "Factor 2", "Factor 3"],
  "publicImpactScore": number from 1 to 10,
  "urgencyIndicators": ["Urgent indicator 1 if applicable"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      return res.status(200).json({ fallback: true, reason: 'Empty response from model' });
    }

    const parsed = JSON.parse(responseText);
    return res.json({
      ...parsed,
      provider: 'Gemini',
      providerLabel: 'Gemini 2.5 Flash',
    });
  } catch (err: any) {
    console.error('[Server Gemini Analysis Error]:', err?.message || err);
    return res.status(200).json({
      fallback: true,
      error: err?.message || 'Inference error',
    });
  }
});

// Gemini Municipal Insights Endpoint
app.post('/api/ai/insights', async (req, res) => {
  try {
    const { complaints } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({ fallback: true, insights: [] });
    }

    const prompt = `You are a Municipal Operations AI analyzing a batch of active municipal citizen complaints in an Indian smart city context.
Identify 2-3 cross-complaint systemic patterns, root cause hypotheses, and recommended preventive department actions.
Remember: AI recommendations are decision-support suggestions for human administrators.

Complaints summary:
${JSON.stringify(complaints || [], null, 2)}

Respond ONLY with a JSON object:
{
  "insights": [
    {
      "title": "Title of systemic pattern",
      "detectedPattern": "Description of the repeated pattern detected across complaints",
      "recommendation": "Specific actionable recommendation for municipal supervisors",
      "priority": "Low" | "Medium" | "High",
      "suggestedDepartment": "Public Works Department" | "Sanitation Department" | "Water Supply Department" | "Electrical Department" | "Traffic & Transit Department" | "Urban Infrastructure Division",
      "location": "Corridor or area name",
      "relatedComplaintIds": ["SC1024", "SC1023"],
      "potentialCauseHypothesis": "Engineering or systemic hypothesis",
      "estimatedImpact": "Civic benefit of preventative intervention"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{"insights":[]}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('[Server Gemini Insights Error]:', err?.message || err);
    return res.status(200).json({ fallback: true, insights: [] });
  }
});

// Mount Vite or serve static dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartCity Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
