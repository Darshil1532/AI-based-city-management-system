import { ComplaintCategory, SeverityLevel, LocationCoordinates } from '../../types';

export interface ReferencedComplaint {
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  referencedComplaints?: ReferencedComplaint[];
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
    userLocation?: LocationCoordinates,
    citizenId?: string
  ): Promise<{
    reply: string;
    referencedComplaints?: ReferencedComplaint[];
    modelUsed: string;
    modelLabel: string;
  }> {
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
        citizenId,
      }),
      signal: AbortSignal.timeout(18000),
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
