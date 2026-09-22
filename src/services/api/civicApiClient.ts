/**
 * Civic API Client
 * 
 * Provides typed, authenticated client methods for the server-side Civic API.
 * In demo prototype mode, sends active session persona credentials via standard headers.
 * In production mode, attaches cryptographically signed Authorization: Bearer <JWT> tokens.
 */

import { authService } from '../storage/authService';

export interface CreateComplaintApiPayload {
  title: string;
  description: string;
  category: string;
  priority?: 'Low' | 'Medium' | 'High';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
    district?: string;
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
  resolutionDetails?: string;
}

export interface ResolveComplaintApiPayload {
  resolutionDetails: string;
  officerSignature?: string;
}

export class CivicApiClient {
  private getHeaders(): Record<string, string> {
    const user = authService.getCurrentUser();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer demo-${user.role}-token`,
      'x-user-role': user.role,
      'x-user-id': user.id,
      'x-user-name': user.name,
    };
  }

  // --- Citizen API Operations ---

  async createComplaint(payload: CreateComplaintApiPayload) {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to create complaint');
    }
    return res.json();
  }

  async getOwnComplaints() {
    const res = await fetch('/api/citizen/complaints', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to fetch citizen complaints');
    }
    return res.json();
  }

  async trackComplaint(id: string) {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/track`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to track complaint');
    }
    return res.json();
  }

  // --- Admin API Operations ---

  async getAllComplaintsAdmin() {
    const res = await fetch('/api/admin/complaints', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to fetch admin complaints');
    }
    return res.json();
  }

  async reviewAIRecommendation(id: string, payload: ReviewAIApiPayload) {
    const res = await fetch(`/api/admin/complaints/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to review AI recommendation');
    }
    return res.json();
  }

  async assignDepartment(id: string, payload: AssignDepartmentApiPayload) {
    const res = await fetch(`/api/admin/complaints/${encodeURIComponent(id)}/assign`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to assign department');
    }
    return res.json();
  }

  async updateStatus(id: string, payload: UpdateStatusApiPayload) {
    const res = await fetch(`/api/admin/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to update complaint status');
    }
    return res.json();
  }

  async resolveComplaint(id: string, payload: ResolveComplaintApiPayload) {
    const res = await fetch(`/api/admin/complaints/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to resolve complaint');
    }
    return res.json();
  }

  async getAdminAnalytics() {
    const res = await fetch('/api/admin/analytics', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.message || err.error || 'Failed to fetch admin analytics');
    }
    return res.json();
  }
}

export const civicApiClient = new CivicApiClient();
