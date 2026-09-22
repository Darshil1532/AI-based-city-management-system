import { complaintService } from './complaintService';
import { departmentService } from './departmentService';
import { GlobalSearchResults, ComplaintSearchResult, DepartmentSearchResult } from '../../types';

export interface SearchDatabaseOptions {
  type?: 'all' | 'complaints' | 'departments';
  limit?: number;
  citizenId?: string;
}

export class GlobalSearchService {
  searchDatabase(rawQuery: string, options?: SearchDatabaseOptions): GlobalSearchResults {
    const query = rawQuery.trim();
    if (!query) {
      return {
        query: '',
        complaints: [],
        departments: [],
        totalMatches: 0,
      };
    }

    const type = options?.type || 'all';
    const limit = options?.limit || 20;
    const citizenId = options?.citizenId;

    let complaints: ComplaintSearchResult[] = [];
    let departments: DepartmentSearchResult[] = [];

    if (type === 'all' || type === 'complaints') {
      let results = complaintService.search(query);
      if (citizenId) {
        results = results.filter((c) => c.item.citizenId === citizenId);
      }
      complaints = results.slice(0, limit);
    }

    if (type === 'all' || type === 'departments') {
      departments = departmentService.search(query).slice(0, limit);
    }

    return {
      query,
      complaints,
      departments,
      totalMatches: complaints.length + departments.length,
    };
  }
}

export const globalSearchService = new GlobalSearchService();
