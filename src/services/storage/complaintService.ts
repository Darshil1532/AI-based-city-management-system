import {
  Complaint,
  ComplaintSearchResult,
} from '../../types';
import { IComplaintRepository } from '../../repositories/types';
import { repositories } from '../../repositories';

export interface IComplaintService {
  getAll(): Complaint[];
  getByCitizenId(citizenId: string): Complaint[];
  getById(id: string): Complaint | undefined;
  getByIdForCitizen(id: string, citizenId: string): Complaint | undefined;
  search(query: string): ComplaintSearchResult[];
  create(complaint: Complaint): Complaint;
  update(id: string, updates: Partial<Complaint>): Complaint | undefined;
  saveAll(complaints: Complaint[]): void;
  reset(): Complaint[];
}

/**
 * ComplaintService manages domain business logic, in-memory indexing, search ranking,
 * and privacy boundaries, delegating persistence to the IComplaintRepository.
 */
export class LocalComplaintService implements IComplaintService {
  private repository: IComplaintRepository;
  private complaints: Complaint[] = [];

  constructor(repository: IComplaintRepository = repositories.complaints) {
    this.repository = repository;
    this.complaints = this.repository.getAll();
  }

  private refreshFromRepository(): void {
    this.complaints = this.repository.getAll();
  }

  getAll(): Complaint[] {
    this.refreshFromRepository();
    return [...this.complaints];
  }

  getByCitizenId(citizenId: string): Complaint[] {
    return this.repository.getByCitizenId(citizenId);
  }

  getById(id: string): Complaint | undefined {
    const norm = id.trim().toUpperCase();
    return this.complaints.find(
      (c) => c.id.toUpperCase() === norm || c.id.toUpperCase() === `SC-${norm}`
    );
  }

  getByIdForCitizen(id: string, citizenId: string): Complaint | undefined {
    const complaint = this.getById(id);
    if (!complaint) return undefined;
    if (complaint.citizenId !== citizenId) {
      console.warn(
        `[Citizen Privacy] Access denied: Citizen ${citizenId} attempted to access complaint ${id} belonging to ${complaint.citizenId}`
      );
      return undefined;
    }
    return complaint;
  }

  search(rawQuery: string): ComplaintSearchResult[] {
    this.refreshFromRepository();
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
      const priorityLower = (c.priority || c.finalPriority || c.aiPriority || '').toLowerCase();

      // ID matching
      if (idUpper === upperQuery || idUpper === `SC-${upperQuery}`) {
        score += 120;
        matchedFields.push('id');
      } else if (idUpper.startsWith(upperQuery) || idUpper.includes(upperQuery)) {
        score += 85;
        matchedFields.push('id');
      }

      // Exact title or keyword matches
      if (titleLower.includes(q)) {
        score += 60;
        matchedFields.push('title');
      }
      if (descLower.includes(q)) {
        score += 40;
        matchedFields.push('description');
      }

      // Category matching
      if (catLower.includes(q)) {
        score += 45;
        matchedFields.push('category');
      }

      // Department matching
      if (deptLower.includes(q)) {
        score += 35;
        matchedFields.push('department');
      }

      // Location matching
      if (addrLower.includes(q) || landmarkLower.includes(q) || districtLower.includes(q)) {
        score += 30;
        matchedFields.push('location');
      }

      // Citizen name matching (for administrators)
      if (citizenLower.includes(q)) {
        score += 25;
        matchedFields.push('citizen');
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
    const created = this.repository.create(complaint);
    this.refreshFromRepository();
    return created;
  }

  update(id: string, updates: Partial<Complaint>): Complaint | undefined {
    const updated = this.repository.update(id, updates);
    this.refreshFromRepository();
    return updated;
  }

  saveAll(complaints: Complaint[]): void {
    this.repository.saveAll(complaints);
    this.refreshFromRepository();
  }

  reset(): Complaint[] {
    const resetList = this.repository.reset();
    this.complaints = [...resetList];
    return resetList;
  }
}

export const complaintService = new LocalComplaintService();
