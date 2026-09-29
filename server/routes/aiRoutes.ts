import { Router, Request, Response } from 'express';
import { aiRateLimiter } from '../middleware/rateLimiter';
import {
  getGeminiClient,
  callGeminiWithFallback,
  GEMINI_PRIMARY_MODEL,
  GEMINI_PRIMARY_MODEL_LABEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_FALLBACK_MODEL_LABEL,
} from '../ai/geminiClient';
import {
  AnalyzeRequestSchema,
  GeminiOutputSchema,
  InsightsRequestSchema,
  GeminiInsightsSchema,
  ChatRequestSchema,
  GenerateComplaintRequestSchema,
  GeneratedComplaintOutputSchema,
} from '../ai/schemas';
import {
  AI_CLASSIFY_SYSTEM_INSTRUCTION,
  buildClassificationPrompt,
  AI_INSIGHTS_SYSTEM_INSTRUCTION,
  buildInsightsPrompt,
  AI_CHAT_ASSISTANT_SYSTEM_INSTRUCTION,
  buildCityAssistantPrompt,
  AI_COMPLAINT_GENERATOR_SYSTEM_INSTRUCTION,
  buildComplaintGenerationPrompt,
} from '../ai/prompts';

export const aiRouter = Router();

// Health check
aiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// AI Service Status
aiRouter.get('/ai/status', (_req: Request, res: Response) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  res.json({
    geminiConfigured: isConfigured,
    activeProvider: isConfigured ? 'Gemini' : 'Demo AI',
    model: isConfigured ? GEMINI_PRIMARY_MODEL : 'Demo AI',
    fallbackModel: GEMINI_FALLBACK_MODEL,
    providerLabel: isConfigured ? GEMINI_PRIMARY_MODEL_LABEL : 'Demo AI',
  });
});

// System Status
aiRouter.get('/system/status', (_req: Request, res: Response) => {
  res.json({
    platform: 'AI-Based Smart City Management System',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  });
});

// POST /api/ai/analyze - Gemini Decision Support with Prompt Injection Defense
aiRouter.post('/ai/analyze', aiRateLimiter, async (req: Request, res: Response) => {
  const reqValidation = AnalyzeRequestSchema.safeParse(req.body);
  if (!reqValidation.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      code: 'INVALID_REQUEST',
      issues: reqValidation.error.flatten(),
    });
  }

  const { description, userCategory, userSeverity, location } = reqValidation.data;
  const ai = getGeminiClient();

  if (!ai) {
    return res.status(503).json({
      error: 'Gemini service unavailable',
      message: 'GEMINI_API_KEY is not configured in server environment.',
      code: 'GEMINI_UNAVAILABLE',
    });
  }

  // Sanitized inputs
  const sanitizedAddress = location?.address ? location.address.replace(/[^\w\s,.-]/gi, ' ').slice(0, 200) : 'City Center';
  const sanitizedLandmark = location?.landmark ? location.landmark.replace(/[^\w\s,.-]/gi, ' ').slice(0, 100) : 'None';
  const sanitizedDistrict = location?.district ? location.district.replace(/[^\w\s,.-]/gi, ' ').slice(0, 100) : 'General';
  const sanitizedDescription = description.slice(0, 3000);

  const prompt = buildClassificationPrompt({
    userCategory,
    userSeverity,
    sanitizedAddress,
    sanitizedLandmark,
    sanitizedDistrict,
    sanitizedDescription,
  });

  try {
    const { text: responseText, modelUsed } = await callGeminiWithFallback(
      ai,
      prompt,
      AI_CLASSIFY_SYSTEM_INSTRUCTION,
      10000
    );

    let parsedRaw: any;
    try {
      parsedRaw = JSON.parse(responseText);
    } catch (parseError) {
      console.warn('[Server Gemini Output Parse Error]:', parseError);
      return res.status(500).json({
        error: 'Failed to parse model output',
        message: 'Malformed JSON returned from Gemini model.',
        code: 'MODEL_OUTPUT_PARSE_ERROR',
      });
    }

    const outputValidation = GeminiOutputSchema.safeParse(parsedRaw);
    if (!outputValidation.success) {
      console.warn('[Server Gemini Schema Validation Failed]:', outputValidation.error.format());
      return res.status(500).json({
        error: 'Gemini output failed schema validation',
        message: 'Model output did not match civic triage schema.',
        code: 'SCHEMA_VALIDATION_ERROR',
        issues: outputValidation.error.flatten(),
      });
    }

    const validated = outputValidation.data;

    return res.json({
      category: validated.category,
      priority: validated.priority,
      department: validated.department,
      confidence: validated.confidence,
      confidencePercent: Math.round(validated.confidence * 100),
      reasoning: validated.reasoning,
      factors: validated.factors,
      publicImpactScore: validated.publicImpactScore,
      urgencyIndicators: validated.urgencyIndicators,
      provider: 'Gemini',
      providerLabel: `Gemini (${modelUsed})`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error('[Server Gemini Error]:', errMsg);

    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        error: 'AI service rate limit reached',
        message: 'The civic AI decision-support service is currently experiencing high demand. Please try again shortly.',
        code: 'RATE_LIMITED',
      });
    }

    if (errMsg.includes('timeout') || errMsg.includes('Timeout')) {
      return res.status(503).json({
        error: 'AI request timed out',
        message: 'The AI decision-support request timed out before completing.',
        code: 'GEMINI_TIMEOUT',
      });
    }

    return res.status(503).json({
      error: 'AI service temporarily unavailable',
      message: 'Automated municipal decision-support is temporarily unavailable. Please proceed with manual triage.',
      code: 'AI_SERVICE_UNAVAILABLE',
    });
  }
});

// POST /api/ai/insights - AI Insights Analysis
aiRouter.post('/ai/insights', aiRateLimiter, async (req: Request, res: Response) => {
  const reqValidation = InsightsRequestSchema.safeParse(req.body);
  if (!reqValidation.success) {
    return res.status(400).json({
      error: 'Invalid insights request payload',
      code: 'INVALID_REQUEST',
      issues: reqValidation.error.flatten(),
    });
  }

  const { complaints } = reqValidation.data;
  const ai = getGeminiClient();

  if (!ai) {
    return res.status(503).json({
      error: 'Gemini service unavailable',
      message: 'GEMINI_API_KEY is not configured in server environment.',
      code: 'GEMINI_UNAVAILABLE',
    });
  }

  const prompt = buildInsightsPrompt(JSON.stringify(complaints, null, 2));

  try {
    const { text: responseText } = await callGeminiWithFallback(
      ai,
      prompt,
      AI_INSIGHTS_SYSTEM_INSTRUCTION,
      10000
    );

    let parsedRaw: any;
    try {
      parsedRaw = JSON.parse(responseText);
    } catch (parseError) {
      return res.status(500).json({
        error: 'Failed to parse model output',
        message: 'Malformed JSON from Gemini model.',
        code: 'MODEL_OUTPUT_PARSE_ERROR',
      });
    }

    const outputValidation = GeminiInsightsSchema.safeParse(parsedRaw);
    if (!outputValidation.success) {
      console.warn('[Server Gemini Insights Schema Validation Failed]:', outputValidation.error.format());
      return res.status(500).json({
        error: 'Gemini insights failed schema validation',
        code: 'SCHEMA_VALIDATION_ERROR',
        issues: outputValidation.error.flatten(),
      });
    }

    return res.json(outputValidation.data);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error('[Server Gemini Insights Error]:', errMsg);

    if (errMsg.includes('timeout')) {
      return res.status(503).json({
        error: 'AI insights timeout',
        message: 'The AI insights request timed out.',
        code: 'GEMINI_TIMEOUT',
      });
    }

    return res.status(503).json({
      error: 'AI insights temporarily unavailable',
      message: 'Automated municipal pattern detection is temporarily unavailable.',
      code: 'AI_SERVICE_UNAVAILABLE',
    });
  }
});

// POST /api/ai/chat - Dynamic civic assistant conversation using Gemini 3.1 Flash Lite
aiRouter.post('/ai/chat', aiRateLimiter, async (req: Request, res: Response) => {
  const reqValidation = ChatRequestSchema.safeParse(req.body);
  if (!reqValidation.success) {
    return res.status(400).json({
      error: 'Invalid chat request',
      issues: reqValidation.error.flatten(),
    });
  }

  const { messages, userLocation } = reqValidation.data;
  const ai = getGeminiClient();

  if (!ai) {
    return res.status(503).json({
      error: 'Gemini service unavailable',
      message: 'GEMINI_API_KEY is not configured in server environment.',
      code: 'GEMINI_UNAVAILABLE',
    });
  }

  const conversationHistory = messages.map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : m.role,
    content: m.content.slice(0, 3000),
  }));

  const prompt = buildCityAssistantPrompt({
    conversationHistory,
    userLocation,
  });

  try {
    const { text, modelUsed, modelLabel } = await callGeminiWithFallback(
      ai,
      prompt,
      AI_CHAT_ASSISTANT_SYSTEM_INSTRUCTION,
      12000,
      'text/plain'
    );

    return res.json({
      reply: text,
      provider: 'Gemini',
      modelUsed,
      modelLabel,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Server Gemini Chat Error]:', err?.message || err);
    return res.status(503).json({
      error: 'Chat response unavailable',
      message: 'Unable to communicate with AI model right now.',
      code: 'AI_CHAT_ERROR',
    });
  }
});

// POST /api/ai/generate-complaint - Synthesizes structured complaint from conversation transcript
aiRouter.post('/ai/generate-complaint', aiRateLimiter, async (req: Request, res: Response) => {
  const reqValidation = GenerateComplaintRequestSchema.safeParse(req.body);
  if (!reqValidation.success) {
    return res.status(400).json({
      error: 'Invalid generate complaint request',
      issues: reqValidation.error.flatten(),
    });
  }

  const { conversationText, userLocation, hasImage } = reqValidation.data;
  const ai = getGeminiClient();

  if (!ai) {
    return res.status(503).json({
      error: 'Gemini service unavailable',
      message: 'GEMINI_API_KEY is not configured in server environment.',
      code: 'GEMINI_UNAVAILABLE',
    });
  }

  const prompt = buildComplaintGenerationPrompt({
    conversationText: conversationText.slice(0, 8000),
    userLocation,
    hasImage,
  });

  try {
    const { text, modelUsed, modelLabel } = await callGeminiWithFallback(
      ai,
      prompt,
      AI_COMPLAINT_GENERATOR_SYSTEM_INSTRUCTION,
      15000,
      'application/json'
    );

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse JSON response from Gemini');
      }
    }

    const outputValidation = GeneratedComplaintOutputSchema.safeParse(parsed);
    if (!outputValidation.success) {
      console.warn('[Generated Complaint validation issue]:', outputValidation.error.flatten());
      return res.status(502).json({
        error: 'Invalid AI generated schema',
        details: outputValidation.error.flatten(),
      });
    }

    return res.json({
      ...outputValidation.data,
      provider: 'Gemini',
      providerLabel: modelLabel,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Server Gemini Generate Complaint Error]:', err?.message || err);
    return res.status(503).json({
      error: 'Failed to synthesize complaint',
      message: err?.message || 'Unable to generate complaint from conversation.',
      code: 'AI_SYNTHESIS_ERROR',
    });
  }
});

