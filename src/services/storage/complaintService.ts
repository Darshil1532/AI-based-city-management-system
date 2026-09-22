import {
  Complaint,
  ComplaintStatus,
  PriorityLevel,
  DepartmentName,
  ComplaintCategory,
  ComplaintSearchResult,
} from '../../types';
import { INITIAL_COMPLAINTS } from '../../data/mockData';

const STORAGE_KEY = 'smartcity_complaints_v2';

export interface IComplaintService {
  getAll(): Complaint[];
  getByCitizenId(citizenId: string): Complaint[];
  getById(id: string): Complaint | undefined;
  search(query: string): ComplaintSearchResult[];
  create(complaint: Complaint): Complaint;
  update(id: string, updates: Partial<Complaint>): Complaint | undefined;
  saveAll(complaints: Complaint[]): void;
  reset(): Complaint[];
}

export class LocalComplaintService implements IComplaintService {
  private complaints: Complaint[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.complaints = JSON.parse(saved);
        return;
      }
    } catch (e) {
      console.warn('[ComplaintService] Could not read from localStorage:', e);
    }
    this.complaints = [...INITIAL_COMPLAINTS];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.complaints));
    } catch (e) {
      console.warn('[ComplaintService] Could not write to localStorage:', e);
    }
  }

  getAll(): Complaint[] {
    return [...this.complaints];
  }

  getByCitizenId(citizenId: string): Complaint[] {
    return this.complaints.filter((c) => c.citizenId === citizenId);
  }

  getById(id: string): Complaint | undefined {
    const norm = id.trim().toUpperCase();
    return this.complaints.find(
      (c) => c.id.toUpperCase() === norm || c.id.toUpperCase() === `SC-${norm}`
    );
  }

  search(rawQuery: string): ComplaintSearchResult[] {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return [];
    const upperQuery = rawQuery.trim().toUpperCase();

    const results: ComplaintSearchResult[] = [];

    for (const c of this.complaints) {
      let score = 0;
      const matchedFields: string[] = [];

      const idUpper = c.id.toUpperCase();
      const titleLower = c.title.toLowerCase();
      const descLower = c.description.toLowerCase();
      const catLower = c.category.toLowerCase();
      const deptLower = (c.department || c.assignedDepartment || '').toLowerCase();
      const addrLower = (c.location.address || '').toLowerCase();
      const landmarkLower = (c.location.landmark || '').toLowerCase();
      const districtLower = (c.location.district || '').toLowerCase();
      const citizenLower = (c.citizenName || '').toLowerCase();
      const statusLower = c.status.toLowerCase();
      const priorityLower = c.priority.toLowerCase();

      // ID matching
      if (idUpper === upperQuery || idUpper === `SC-${upperQuery}`) {
        score += 120;
        matchedFields.push('id');
      } else if (idUpper.startsWith(upperQuery) || idUpper.includes(upperQuery)) {
        score += 85;
        matchedFields.push('id');
      }

      // Title matching
      if (titleLower === q) {
        score += 80;
        matchedFields.push('title');
      } else if (titleLower.includes(q)) {
        score += 60;
        matchedFields.push('title');
      }

      // Category matching
      if (catLower.includes(q)) {
        score += 45;
        matchedFields.push('category');
      }

      // Department matching
      if (deptLower.includes(q)) {
        score += 45;
        matchedFields.push('department');
      }

      // Location matching (Address, Landmark, District)
      if (addrLower.includes(q) || landmarkLower.includes(q) || districtLower.includes(q)) {
        score += 40;
        matchedFields.push('location');
      }

      // Citizen name matching
      if (citizenLower.includes(q)) {
        score += 35;
        matchedFields.push('citizen');
      }

      // Description matching
      if (descLower.includes(q)) {
        score += 25;
        matchedFields.push('description');
      }

      // Status / Priority match
      if (statusLower === q || statusLower.replace('_', ' ') === q) {
        score += 20;
        matchedFields.push('status');
      }
      if (priorityLower === q) {
        score += 20;
        matchedFields.push('priority');
      }

      if (score > 0) {
        results.push({
          item: c,
          matchedFields,
          snippet: `${c.location.landmark || c.location.address} • ${c.category} • ${c.status.toUpperCase()}`,
          score,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  create(complaint: Complaint): Complaint {
    this.complaints = [complaint, ...this.complaints];
    this.persist();
    return complaint;
  }

  update(id: string, updates: Partial<Complaint>): Complaint | undefined {
    let updated: Complaint | undefined;
    this.complaints = this.complaints.map((c) => {
      if (c.id === id) {
        updated = {
          ...c,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }
      return c;
    });

    if (updated) {
      this.persist();
    }
    return updated;
  }

  saveAll(complaints: Complaint[]): void {
    this.complaints = [...complaints];
    this.persist();
  }

  reset(): Complaint[] {
    this.complaints = [...INITIAL_COMPLAINTS];
    this.persist();
    return [...this.complaints];
  }
}

export const complaintService = new LocalComplaintService();
