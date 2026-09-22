/**
 * Demo authentication for prototype.
 * 
 * ARCHITECTURE NOTICE:
 * This authentication service is a client-side mock implementation designed specifically
 * for hackathon evaluation and interactive UI workflow demonstration.
 * 
 * DO NOT claim production-grade security for this prototype authentication layer.
 * 
 * The architecture is intentionally decoupled via the IAuthService interface and IAuthRepository,
 * allowing this module to be seamlessly replaced with enterprise identity providers:
 * - Supabase Auth (OAuth 2.0 / JWT)
 * - Firebase Auth (Google / Phone / Email Auth)
 * - Custom JWT (HttpOnly Secure Session Cookies)
 * - Auth.js (NextAuth / OpenID Connect)
 */

import { UserProfile } from '../../types';
import { IAuthRepository } from '../../repositories/types';
import {
  DEMO_CITIZEN_PROFILE,
  DEMO_ADMIN_PROFILE,
} from '../../repositories/local/LocalStorageRepositories';
import { repositories } from '../../repositories';

export const DEMO_CITIZEN = DEMO_CITIZEN_PROFILE;
export const DEMO_ADMIN = DEMO_ADMIN_PROFILE;

export interface IAuthService {
  readonly currentUser: UserProfile;
  readonly role: 'citizen' | 'admin';
  readonly isAuthenticated: boolean;
  getCurrentUser(): UserProfile;
  login(role: 'citizen' | 'admin', customName?: string): UserProfile;
  logout(): void;
  isAdmin(): boolean;
  isCitizen(): boolean;
}

export class AuthService implements IAuthService {
  private repository: IAuthRepository;
  private user: UserProfile;

  constructor(repository: IAuthRepository = repositories.auth) {
    this.repository = repository;
    this.user = this.repository.getCurrentUser();
  }

  get currentUser(): UserProfile {
    return { ...this.user };
  }

  get role(): 'citizen' | 'admin' {
    return this.user.role;
  }

  get isAuthenticated(): boolean {
    // In demo prototype mode, the session is active as either citizen or admin
    return !!this.user && !!this.user.id;
  }

  getCurrentUser(): UserProfile {
    return { ...this.user };
  }

  login(role: 'citizen' | 'admin', customName?: string): UserProfile {
    if (role === 'admin') {
      this.user = customName ? { ...DEMO_ADMIN, name: customName } : DEMO_ADMIN;
    } else {
      this.user = customName ? { ...DEMO_CITIZEN, name: customName } : DEMO_CITIZEN;
    }
    this.repository.saveCurrentUser(this.user);
    return { ...this.user };
  }

  logout(): void {
    // Return to default citizen persona for prototype navigation continuity
    this.user = DEMO_CITIZEN;
    this.repository.saveCurrentUser(this.user);
  }

  isAdmin(): boolean {
    return this.user.role === 'admin';
  }

  isCitizen(): boolean {
    return this.user.role === 'citizen';
  }
}

export const authService = new AuthService();
