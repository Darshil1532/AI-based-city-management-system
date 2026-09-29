import { ComplaintCategory, SeverityLevel, LocationCoordinates } from '../../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface GeneratedComplaintDraft {
  title: string;
  category: ComplaintCategory;
  severity: SeverityLevel;
  description: string;
  location: {
    address: string;
    landmark?: string;
    district?: string;
    latitude: number;
    longitude: number;
  };
  confidence: number;
  provider: string;
  providerLabel: string;
}

class AIChatService {
  async sendChatMessage(
    messages: Array<{ role: 'user' | 'model'; content: string }>,
    userLocation?: LocationCoordinates
  ): Promise<{ reply: string; modelUsed: string; modelLabel: string }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        userLocation: userLocation
          ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              address: userLocation.address,
            }
          : undefined,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `AI Chat service error (${res.status})`);
    }

    return res.json();
  }

  async generateComplaintFromChat(
    conversationText: string,
    userLocation?: LocationCoordinates,
    hasImage?: boolean
  ): Promise<GeneratedComplaintDraft> {
    const res = await fetch('/api/ai/generate-complaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationText,
        userLocation,
        hasImage,
      }),
      signal: AbortSignal.timeout(18000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `AI Complaint Synthesis error (${res.status})`);
    }

    return res.json();
  }
}

export const aiChatService = new AIChatService();
