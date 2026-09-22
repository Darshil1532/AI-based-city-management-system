/**
 * Demo authentication for prototype.
 * 
 * ARCHITECTURAL NOTICE:
 * This authentication context provides client-side persona management for hackathon demo workflows.
 * 
 * DO NOT claim production-grade security for this prototype auth layer.
 * 
 * Future Production Migration:
 * This context is designed with strict decoupling so it can be swapped with:
 * - Supabase Auth (supabase.auth.onAuthStateChange, RLS session JWTs)
 * - Firebase Auth (onAuthStateChanged, Firebase ID tokens)
 * - Custom JWT (HttpOnly secure session cookies verified by API gateways)
 * - Auth.js / NextAuth (OAuth 2.0 / OpenID Connect sessions)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { authService, DEMO_CITIZEN, DEMO_ADMIN } from '../services/storage/authService';

export interface AuthContextType {
  currentUser: UserProfile;
  role: 'citizen' | 'admin';
  isAuthenticated: boolean;
  login: (role: 'citizen' | 'admin', customName?: string) => UserProfile;
  logout: () => void;
  isAdmin: boolean;
  isCitizen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => authService.getCurrentUser());

  // Keep state synchronized with authService
  const role = currentUser.role;
  const isAuthenticated = authService.isAuthenticated;
  const isAdmin = currentUser.role === 'admin';
  const isCitizen = currentUser.role === 'citizen';

  const login = (newRole: 'citizen' | 'admin', customName?: string): UserProfile => {
    const updated = authService.login(newRole, customName);
    setCurrentUser(updated);
    return updated;
  };

  const logout = (): void => {
    authService.logout();
    setCurrentUser(authService.getCurrentUser());
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        login,
        logout,
        isAdmin,
        isCitizen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
