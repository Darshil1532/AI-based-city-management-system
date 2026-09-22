import { UserProfile } from '../../types';

export const DEMO_CITIZEN: UserProfile = {
  id: 'CIT-DEMO-01',
  name: 'Demo Citizen',
  role: 'citizen',
  email: 'demo.citizen@smartcity.local',
  phone: '+91 98260 12345',
  title: 'Verified Resident • MP Nagar Ward 12',
  badge: 'Resident Account (Demo)',
};

export const DEMO_ADMIN: UserProfile = {
  id: 'ADM-DEMO-01',
  name: 'Demo Administrator',
  role: 'admin',
  email: 'admin@smartcity.local',
  phone: '+91 98260 54321',
  title: 'Municipal Operations Lead • Civic Command Center',
  badge: 'Clearance Level 4 (Admin)',
  department: 'Municipal Operations & Maintenance',
};

const STORAGE_KEY = 'smartcity_auth_user_v2';

export interface IAuthService {
  getCurrentUser(): UserProfile;
  isAuthenticated(): boolean;
  login(role: 'citizen' | 'admin', customName?: string): UserProfile;
  logout(): void;
  isAdmin(): boolean;
  isCitizen(): boolean;
}

export class AuthService implements IAuthService {
  private user: UserProfile = DEMO_CITIZEN;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.user = JSON.parse(saved);
        return;
      }
    } catch (e) {
      console.warn('[AuthService] Failed to read auth state from localStorage:', e);
    }
    this.user = DEMO_CITIZEN;
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user));
    } catch (e) {
      console.warn('[AuthService] Failed to persist auth state:', e);
    }
  }

  getCurrentUser(): UserProfile {
    return { ...this.user };
  }

  isAuthenticated(): boolean {
    return true; // Always authenticated in demo mode as citizen or admin
  }

  login(role: 'citizen' | 'admin', customName?: string): UserProfile {
    if (role === 'admin') {
      this.user = customName ? { ...DEMO_ADMIN, name: customName } : DEMO_ADMIN;
    } else {
      this.user = customName ? { ...DEMO_CITIZEN, name: customName } : DEMO_CITIZEN;
    }
    this.persist();
    return { ...this.user };
  }

  logout(): void {
    this.user = DEMO_CITIZEN;
    this.persist();
  }

  isAdmin(): boolean {
    return this.user.role === 'admin';
  }

  isCitizen(): boolean {
    return this.user.role === 'citizen';
  }
}

export const authService = new AuthService();
