import { Complaint, ComplaintStatus, PriorityLevel, DepartmentName, ComplaintCategory } from '../../types';
import { INITIAL_COMPLAINTS } from '../../data/mockData';

const STORAGE_KEY = 'smartcity_complaints_v2';

export interface IComplaintService {
  getAll(): Complaint[];
  getByCitizenId(citizenId: string): Complaint[];
  getById(id: string): Complaint | undefined;
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
