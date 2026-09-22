import { DepartmentInfo, DepartmentSearchResult } from '../../types';
import { INITIAL_DEPARTMENTS } from '../../data/mockData';

const STORAGE_KEY = 'smartcity_departments_v2';

// Semantic keywords matching municipal functions to departments
const DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  'Public Works Department': [
    'road',
    'pothole',
    'asphalt',
    'crater',
    'bridge',
    'pavement',
    'street',
    'footpath',
    'sidewalk',
    'tar',
    'surface',
    'civil',
  ],
  'Sanitation Department': [
    'garbage',
    'waste',
    'trash',
    'dump',
    'overflow',
    'cleanliness',
    'hygiene',
    'sweeping',
    'litter',
    'bin',
    'dustbin',
    'solid waste',
  ],
  'Water Supply Department': [
    'water',
    'leak',
    'pipe',
    'pipeline',
    'contamination',
    'tap',
    'supply',
    'pressure',
    'valve',
    'drinking water',
    'meter',
  ],
  'Electrical Department': [
    'streetlight',
    'lamp',
    'power',
    'light',
    'dark',
    'wire',
    'cable',
    'transformer',
    'pole',
    'blackout',
    'electric',
    'illumination',
  ],
  'Traffic & Transit Department': [
    'traffic',
    'signal',
    'congestion',
    'bus',
    'junction',
    'transit',
    'crosswalk',
    'intersection',
    'bottleneck',
    'stoplight',
    'signage',
  ],
  'Urban Infrastructure Division': [
    'drainage',
    'infrastructure',
    'drain',
    'manhole',
    'sewer',
    'sewage',
    'flooding',
    'gutter',
    'culvert',
    'stormwater',
    'structural',
  ],
  'General Municipal Administration': [
    'admin',
    'civic',
    'general',
    'permit',
    'grievance',
    'office',
    'council',
    'inquiry',
  ],
};

export interface IDepartmentService {
  getAll(): DepartmentInfo[];
  getById(id: string): DepartmentInfo | undefined;
  getByName(name: string): DepartmentInfo | undefined;
  search(query: string): DepartmentSearchResult[];
  saveAll(departments: DepartmentInfo[]): void;
  reset(): DepartmentInfo[];
}

export class LocalDepartmentService implements IDepartmentService {
  private departments: DepartmentInfo[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.departments = JSON.parse(saved);
        return;
      }
    } catch (e) {
      console.warn('[DepartmentService] Could not read from localStorage:', e);
    }
    this.departments = [...INITIAL_DEPARTMENTS];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.departments));
    } catch (e) {
      console.warn('[DepartmentService] Could not write to localStorage:', e);
    }
  }

  getAll(): DepartmentInfo[] {
    return [...this.departments];
  }

  getById(id: string): DepartmentInfo | undefined {
    const norm = id.trim().toLowerCase();
    return this.departments.find((d) => d.id.toLowerCase() === norm);
  }

  getByName(name: string): DepartmentInfo | undefined {
    const norm = name.trim().toLowerCase();
    return this.departments.find((d) => d.name.toLowerCase() === norm);
  }

  search(rawQuery: string): DepartmentSearchResult[] {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return [];

    const results: DepartmentSearchResult[] = [];

    for (const dept of this.departments) {
      let score = 0;
      const matchedFields: string[] = [];
      const deptNameLower = dept.name.toLowerCase();
      const headLower = dept.head.toLowerCase();
      const emailLower = (dept.contactEmail || dept.email || '').toLowerCase();
      const phoneLower = (dept.contactPhone || '').toLowerCase();

      // Exact name match
      if (deptNameLower === q) {
        score += 100;
        matchedFields.push('name');
      } else if (deptNameLower.startsWith(q)) {
        score += 75;
        matchedFields.push('name');
      } else if (deptNameLower.includes(q)) {
        score += 55;
        matchedFields.push('name');
      }

      // Department head match
      if (headLower.includes(q)) {
        score += 50;
        matchedFields.push('head');
      }

      // Email or phone match
      if (emailLower.includes(q)) {
        score += 40;
        matchedFields.push('email');
      }
      if (phoneLower.includes(q)) {
        score += 40;
        matchedFields.push('phone');
      }

      // Semantic domain keywords
      const keywords = DEPARTMENT_KEYWORDS[dept.name] || [];
      const matchedKeyword = keywords.find(
        (kw) => kw.includes(q) || q.includes(kw)
      );
      if (matchedKeyword) {
        score += 45;
        matchedFields.push(`domain (${matchedKeyword})`);
      }

      if (score > 0) {
        results.push({
          item: dept,
          matchedFields,
          snippet: `Lead: ${dept.head} • SLA: ${dept.avgResolutionHours}h • Efficiency: ${dept.efficiencyScore}%`,
          score,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  saveAll(departments: DepartmentInfo[]): void {
    this.departments = [...departments];
    this.persist();
  }

  reset(): DepartmentInfo[] {
    this.departments = [...INITIAL_DEPARTMENTS];
    this.persist();
    return [...this.departments];
  }
}

export const departmentService = new LocalDepartmentService();
