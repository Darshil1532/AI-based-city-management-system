import { GoogleGenAI } from '@google/genai';

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
): Promise<{ text: string; modelUsed: string }> {
  // Use recommended flash model
  const primaryModel = 'gemini-2.5-flash';
  const fallbackModel = 'gemini-2.5-flash-lite';

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout on primary model (${primaryModel})`)), timeoutMs)
    );
    const aiPromise = ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const response = await Promise.race([aiPromise, timeoutPromise]);
    const text = response.text?.trim();
    if (text) {
      return { text, modelUsed: primaryModel };
    }
  } catch (primaryErr: any) {
    console.warn(
      `[Server Gemini] Primary model (${primaryModel}) notice: ${primaryErr?.message || primaryErr}. Attempting fallback model (${fallbackModel})...`
    );
  }

  // Fallback model
  const fallbackTimeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout on fallback model (${fallbackModel})`)), timeoutMs)
  );
  const fallbackPromise = ai.models.generateContent({
    model: fallbackModel,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    },
  });

  const fallbackResponse = await Promise.race([fallbackPromise, fallbackTimeoutPromise]);
  const fallbackText = fallbackResponse.text?.trim();
  if (!fallbackText) {
    throw new Error(`Both ${primaryModel} and fallback ${fallbackModel} returned empty responses.`);
  }

  return { text: fallbackText, modelUsed: fallbackModel };
}
