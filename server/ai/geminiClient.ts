import { GoogleGenAI } from '@google/genai';

export const GEMINI_PRIMARY_MODEL = 'gemini-2.5-flash';
export const GEMINI_PRIMARY_MODEL_LABEL = 'Gemini 2.5 Flash';
export const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash-lite';
export const GEMINI_FALLBACK_MODEL_LABEL = 'Gemini 2.5 Flash Lite';

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
  timeoutMs: number = 10000
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
        responseMimeType: 'application/json',
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
        responseMimeType: 'application/json',
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
