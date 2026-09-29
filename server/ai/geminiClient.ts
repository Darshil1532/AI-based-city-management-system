import { GoogleGenAI } from '@google/genai';

export const GEMINI_PRIMARY_MODEL = process.env.GEMINI_PRIMARY_MODEL || 'gemini-3.1-flash-lite';
export const GEMINI_PRIMARY_MODEL_LABEL = 'Gemini 3.1 Flash Lite';
export const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
export const GEMINI_FALLBACK_MODEL_LABEL = 'Gemini 3.5 Flash Lite';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

export async function callGeminiWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  timeoutMs: number = 10000,
  responseMimeType: string = 'application/json'
): Promise<{ text: string; modelUsed: string; modelLabel: string }> {
  const primaryModel = GEMINI_PRIMARY_MODEL;
  const fallbackModel = GEMINI_FALLBACK_MODEL;

  const primaryController = new AbortController();
  const primaryTimer = setTimeout(() => primaryController.abort(), timeoutMs);

  try {
    const aiPromise = (ai.models as any).generateContent({
      model: primaryModel,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType,
        abortSignal: primaryController.signal,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      primaryController.signal.addEventListener('abort', () =>
        reject(new Error(`Timeout on primary model (${primaryModel}) after ${timeoutMs}ms`))
      );
    });

    const response = await Promise.race([aiPromise, timeoutPromise]);
    clearTimeout(primaryTimer);
    const text = response.text?.trim();
    if (text) {
      return { text, modelUsed: primaryModel, modelLabel: GEMINI_PRIMARY_MODEL_LABEL };
    }
  } catch (primaryErr: any) {
    clearTimeout(primaryTimer);
    primaryController.abort();
    console.warn(
      `[Server Gemini] Primary model (${primaryModel}) notice: ${primaryErr?.message || primaryErr}. Attempting fallback model (${fallbackModel})...`
    );
  }

  // Fallback model
  const fallbackController = new AbortController();
  const fallbackTimer = setTimeout(() => fallbackController.abort(), timeoutMs);

  try {
    const fallbackPromise = (ai.models as any).generateContent({
      model: fallbackModel,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType,
        abortSignal: fallbackController.signal,
      },
    });

    const fallbackTimeoutPromise = new Promise<never>((_, reject) => {
      fallbackController.signal.addEventListener('abort', () =>
        reject(new Error(`Timeout on fallback model (${fallbackModel}) after ${timeoutMs}ms`))
      );
    });

    const fallbackResponse = await Promise.race([fallbackPromise, fallbackTimeoutPromise]);
    clearTimeout(fallbackTimer);
    const fallbackText = fallbackResponse.text?.trim();
    if (!fallbackText) {
      throw new Error(`Both ${primaryModel} and fallback ${fallbackModel} returned empty responses.`);
    }

    return { text: fallbackText, modelUsed: fallbackModel, modelLabel: GEMINI_FALLBACK_MODEL_LABEL };
  } finally {
    clearTimeout(fallbackTimer);
    fallbackController.abort();
  }
}

export interface CitizenIssueQueryResult {
  id: string;
  title: string;
  category: string;
  status: string;
  priority?: string;
  department?: string;
  address?: string;
  landmark?: string;
  district?: string;
  createdAt?: string;
  updatedAt?: string;
  resolutionSummary?: string | null;
}

export const CITIZEN_ISSUES_TOOL = {
  functionDeclarations: [
    {
      name: 'queryCitizenIssues',
      description:
        'Lookup existing registered civic complaints and their live municipal status. ONLY invoke this tool when the citizen asks about existing complaints, ticket status, asks what issues are registered, or mentions an existing ticket ID (e.g. SC-2026-XXXX). NEVER call this tool for simple greetings (hi, hello), general city information, or when reporting a brand-new issue.',
      parameters: {
        type: 'OBJECT',
        properties: {
          complaintId: {
            type: 'STRING',
            description:
              'Optional specific complaint ticket ID (e.g., SC-2026-8KWH) if the citizen mentioned one.',
          },
          statusFilter: {
            type: 'STRING',
            description:
              'Optional status filter (e.g. submitted, assigned, in_progress, resolved) if the citizen specifically asked about issues in that status.',
          },
        },
      },
    },
  ],
};

export async function callGeminiChatWithTools(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  executeTool: (
    name: string,
    args: any
  ) => Promise<{ response: any; complaints?: CitizenIssueQueryResult[] }>,
  timeoutMs: number = 14000
): Promise<{
  text: string;
  referencedComplaints: CitizenIssueQueryResult[];
  modelUsed: string;
  modelLabel: string;
}> {
  const models = [
    { name: GEMINI_PRIMARY_MODEL, label: GEMINI_PRIMARY_MODEL_LABEL },
    { name: GEMINI_FALLBACK_MODEL, label: GEMINI_FALLBACK_MODEL_LABEL },
  ];

  let lastError: any = null;

  for (const { name: modelName, label: modelLabel } of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const aiPromise = (ai.models as any).generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          tools: [CITIZEN_ISSUES_TOOL],
          abortSignal: controller.signal,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () =>
          reject(new Error(`Timeout on model (${modelName}) after ${timeoutMs}ms`))
        );
      });

      const response = await Promise.race([aiPromise, timeoutPromise]);

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const { response: toolResponse, complaints = [] } = await executeTool(
          call.name,
          call.args || {}
        );

        const modelContent = response.candidates?.[0]?.content || {
          role: 'model',
          parts: [{ functionCall: { name: call.name, args: call.args || {} } }],
        };

        const followUpPromise = (ai.models as any).generateContent({
          model: modelName,
          contents: [
            { role: 'user', parts: [{ text: prompt }] },
            modelContent,
            {
              role: 'user',
              parts: [
                {
                  functionResponse: {
                    name: call.name,
                    response: toolResponse,
                  },
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            abortSignal: controller.signal,
          },
        });

        const followUpRes = await Promise.race([followUpPromise, timeoutPromise]);
        clearTimeout(timer);
        const text = followUpRes.text?.trim() || '';
        return {
          text,
          referencedComplaints: complaints,
          modelUsed: modelName,
          modelLabel,
        };
      }

      clearTimeout(timer);
      const text = response.text?.trim();
      if (!text) {
        throw new Error(`Model ${modelName} returned empty response.`);
      }

      return {
        text,
        referencedComplaints: [],
        modelUsed: modelName,
        modelLabel,
      };
    } catch (err: any) {
      clearTimeout(timer);
      controller.abort();
      lastError = err;
      console.warn(`[Server Gemini Chat] Model ${modelName} notice: ${err?.message || err}.`);
      if (modelName === models[0].name) {
        console.info(`[Server Gemini Chat] Switching to fallback model ${models[1].name}...`);
      }
    }
  }

  throw lastError || new Error('All Gemini chat models failed.');
}

