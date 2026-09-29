/**
 * Civic API Client
 * 
 * Provides typed, authenticated client methods for the authoritative server-side Civic API.
 * In production mode, attaches cryptographically verified Firebase ID tokens:
 *   Authorization: Bearer <real Firebase ID token>
 * In local/demo test mode, provides fallback to isolated demo tokens.
 */

import { auth } from '../../lib/firebase';
import { authService } from '../storage/authService';
import { NotificationItem, AIInsight, Hotspot } from '../../types';

export interface CreateComplaintApiPayload {
  title: string;
  description: string;
  category: string;
  severity?: 'Low' | 'Medium' | 'High';
  priority?: 'Low' | 'Medium' | 'High';
  citizenPhone?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
    district?: string;
  };
  aiAnalysis?: {
    category: string;
    priority: 'Low' | 'Medium' | 'High';
    department: string;
    confidence?: number;
    reasoning: string;
    factors: string[];
    provider?: 'Gemini' | 'Demo AI';
    providerLabel?: string;
  };
}

export interface ReviewAIApiPayload {
  decision: 'ratified' | 'overridden';
  finalCategory?: string;
  finalPriority?: 'Low' | 'Medium' | 'High';
  assignedDepartment?: string;
  notes?: string;
}

export interface AssignDepartmentApiPayload {
  department: string;
  officer?: string;
  notes?: string;
}

export interface UpdateStatusApiPayload {
  status: 'submitted' | 'assigned' | 'in_progress' | 'resolved';
  notes?: string;
  overrideRationale?: string;
  resolutionDetails?: string;
  officerSignature?: string;
}

export interface ResolveComplaintApiPayload {
  resolutionDetails: string;
  officerSignature?: string;
  overrideRationale?: string;
}

export class CivicApiClient {
  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 1. Primary: Real Firebase Auth ID Token
    if (auth && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          return headers;
        }
      } catch (err) {
        console.warn('[CivicApiClient] Notice retrieving Firebase ID token:', err);
      }
    }

    // 2. Demo environment fallback
    const user = authService.getCurrentUser();
    headers['Authorization'] = `Bearer demo-${user.role}-token`;
    return headers;
  }

  // --- Citizen & Public API Operations ---

  async getAllComplaints() {
    const headers = await this.getHeaders();
    const res = await fetch('/api/complaints', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to fetch complaints feed');
    }
    return res.json();
  }

  async createComplaint(payload: CreateComplaintApiPayload) {
    const headers = await this.getHeaders();
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to create complaint');
    }
    return res.json();
  }

  async getOwnComplaints() {
    const headers = await this.getHeaders();
    const res = await fetch('/api/citizen/complaints', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to fetch citizen complaints');
    }
    return res.json();
  }

  async trackComplaint(id: string) {
    const headers = await this.getHeaders();
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/track`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to track complaint');
    }
    return res.json();
  }

  // --- Notifications Operations ---

  async getNotifications(): Promise<{ count: number; notifications: NotificationItem[] }> {
    const headers = await this.getHeaders();
    const res = await fetch('/api/notifications', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to fetch notifications');
    }
    return res.json();
  }

  async createNotification(payload: {
    userId: string;
    title: string;
    message: string;
    type: NotificationItem['type'];
    link?: string;
  }): Promise<{ message: string; notification: NotificationItem }> {
    const headers = await this.getHeaders();
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to create notification');
    }
    return res.json();
  }

  async markNotificationRead(id: string): Promise<void> {
    const headers = await this.getHeaders();
    const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to mark notification read');
    }
  }

  async clearAllNotifications(): Promise<void> {
    const headers = await this.getHeaders();
    const res = await fetch('/api/notifications', {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to clear notifications');
    }
  }

  // --- Hotspots Operations ---

  async getHotspots(): Promise<{ count: number; hotspots: Hotspot[] }> {
    const headers = await this.getHeaders();
    const res = await fetch('/api/hotspots', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to fetch hotspots');
    }
    return res.json();
  }

  async recalculateHotspots(): Promise<{ message: string; count: number; hotspots: Hotspot[] }> {
    const headers = await this.getHeaders();
    const res = await fetch('/api/admin/hotspots/recalculate', {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to recalculate hotspots');
    }
    return res.json();
  }

  // --- Admin API Operations ---

  async getAdminInsights(): Promise<{ count: number; insights: AIInsight[] }> {
    const headers = await this.getHeaders();
    const res = await fetch('/api/admin/insights', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to fetch admin insights');
    }
    return res.json();
  }

  async updateInsightStatus(
    id: string,
    status: AIInsight['status'],
    actionNote?: string
  ): Promise<{ message: string; insight: AIInsight }> {
    const headers = await this.getHeaders();
    const res = await fetch(`/api/admin/insights/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, actionNote }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to update insight status');
    }
    return res.json();
  }

  async getAllComplaintsAdmin() {
    const headers = await this.getHeaders();
    const res = await fetch('/api/admin/complaints', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to fetch admin complaints');
    }
    return res.json();
  }

  async reviewAIRecommendation(id: string, payload: ReviewAIApiPayload) {
    const headers = await this.getHeaders();
    const res = await fetch(`/api/admin/complaints/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to review AI recommendation');
    }
    return res.json();
  }

  async assignDepartment(id: string, payload: AssignDepartmentApiPayload) {
    const headers = await this.getHeaders();
    const res = await fetch(`/api/admin/complaints/${encodeURIComponent(id)}/assign`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to assign department');
    }
    return res.json();
  }

  async updateStatus(id: string, payload: UpdateStatusApiPayload) {
    const headers = await this.getHeaders();
    const res = await fetch(`/api/admin/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to update complaint status');
    }
    return res.json();
  }

  async resolveComplaint(id: string, payload: ResolveComplaintApiPayload) {
    const headers = await this.getHeaders();
    const res = await fetch(`/api/admin/complaints/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to resolve complaint');
    }
    return res.json();
  }

  async getAdminAnalytics() {
    const headers = await this.getHeaders();
    const res = await fetch('/api/admin/analytics', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to fetch admin analytics');
    }
    return res.json();
  }
}

export const civicApiClient = new CivicApiClient();
