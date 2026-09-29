import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Complaint,
  Hotspot,
  AIInsight,
  DepartmentInfo,
  ComplaintCategory,
  SeverityLevel,
  PriorityLevel,
  ComplaintStatus,
  DepartmentName,
  LocationCoordinates,
  UserProfile,
  NotificationItem,
} from '../types';
import { INITIAL_DEPARTMENTS } from '../data/mockData';
import { complaintService } from '../services/storage/complaintService';
import { hotspotService } from '../services/storage/hotspotService';
import { insightService } from '../services/storage/insightService';
import { notificationService } from '../services/storage/notificationService';
import { departmentService } from '../services/storage/departmentService';
import { globalSearchService, SearchDatabaseOptions } from '../services/storage/globalSearchService';
import { authService, DEMO_CITIZEN, DEMO_ADMIN } from '../services/storage/authService';
import { aiService } from '../services/ai/AIService';
import { civicApiClient } from '../services/api/civicApiClient';
import { GlobalSearchResults } from '../types';
import { useAuth } from './AuthContext';

export { DEMO_CITIZEN, DEMO_ADMIN };

export interface AppContextType {
  // Complaints
  complaints: Complaint[]; // Privacy-filtered: citizen sees own, admin sees all
  allComplaints: Complaint[]; // Full dataset for municipal administration
  myComplaints: Complaint[]; // Complaints belonging to current logged-in user
  lastSubmittedComplaint: Complaint | null;
  getComplaintById: (id: string) => Complaint | undefined;
  getComplaintForCitizen: (id: string, citizenId: string) => Complaint | undefined;

  // Global Search & Database Querying
  searchDatabase: (query: string, options?: SearchDatabaseOptions) => GlobalSearchResults;
  isCommandBarOpen: boolean;
  setIsCommandBarOpen: (open: boolean) => void;
  commandBarInitialQuery: string;
  openCommandBar: (initialQuery?: string) => void;
  closeCommandBar: () => void;

  // Complaint Operations & Human-in-the-Loop Decisions
  submitComplaint: (data: {
    title?: string;
    description: string;
    category: ComplaintCategory;
    severity: SeverityLevel;
    location: LocationCoordinates;
    image?: string;
    citizenName?: string;
    citizenPhone?: string;
  }) => Promise<Complaint>;

  ratifyAIRecommendation: (id: string, adminNotes?: string) => void;
  overrideAIRecommendation: (
    id: string,
    overrides: {
      category?: ComplaintCategory;
      priority?: PriorityLevel;
      department?: DepartmentName;
      officer?: string;
      notes?: string;
    }
  ) => void;

  updateComplaintStatus: (
    id: string,
    newStatus: ComplaintStatus,
    adminNotes?: string,
    resolutionDetails?: string
  ) => void;
  updateComplaintDetails: (
    id: string,
    updates: Partial<Complaint>,
    auditNote?: string
  ) => void;
  updateComplaint: (id: string, updates: Partial<Complaint>) => void;
  resolveComplaint: (id: string, resolutionDetails?: string, overrideNote?: string) => void;

  // Batch Operations
  bulkAssignDepartment: (
    ids: string[],
    department: DepartmentName,
    officer?: string,
    notes?: string
  ) => void;
  bulkUpdateStatus: (
    ids: string[],
    newStatus: ComplaintStatus,
    notes?: string,
    resolutionDetails?: string
  ) => void;
  bulkUpdatePriority: (
    ids: string[],
    priority: PriorityLevel,
    notes?: string
  ) => void;
  bulkRatifyAIRecommendations: (ids: string[]) => void;

  // Hotspots & Clustering
  hotspots: Hotspot[];
  recalculateHotspotsNow: () => void;

  // AI Insights
  aiInsights: AIInsight[];
  updateInsightStatus: (
    id: string,
    status: 'new' | 'reviewed' | 'action_taken' | 'dismissed'
  ) => void;
  applyInsightAction: (id: string, actionNote: string) => void;
  dismissInsight: (id: string) => void;

  // Departments
  departments: DepartmentInfo[];

  // Authentication & Clearance
  currentUser: UserProfile;
  role: 'citizen' | 'admin';
  isAuthenticated: boolean;
  activePersona: 'citizen' | 'admin';
  setActivePersona: (persona: 'citizen' | 'admin') => void;
  loginAs: (role: 'citizen' | 'admin', customName?: string) => void;
  login: (role: 'citizen' | 'admin', customName?: string) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // AI Provider Details
  aiProviderType: 'Gemini' | 'Demo AI';
  aiProviderLabel: string;

  // Reset Data
  resetToDefaults: () => void;
  resetData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const currentUser = auth.currentUser;
  const [allComplaintsList, setAllComplaintsList] = useState<Complaint[]>(() =>
    complaintService.getAll()
  );
  const [hotspotsList, setHotspotsList] = useState<Hotspot[]>(() => hotspotService.getAll());
  const [insightsList, setInsightsList] = useState<AIInsight[]>(() => insightService.getAll());
  const [departmentsList, setDepartmentsList] = useState<DepartmentInfo[]>(() =>
    departmentService.getAll()
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [commandBarInitialQuery, setCommandBarInitialQuery] = useState('');
  const [lastSubmittedComplaint, setLastSubmittedComplaint] = useState<Complaint | null>(null);

  const openCommandBar = useCallback((initialQuery: string = '') => {
    setCommandBarInitialQuery(initialQuery);
    setIsCommandBarOpen(true);
  }, []);

  const closeCommandBar = useCallback(() => {
    setIsCommandBarOpen(false);
    setCommandBarInitialQuery('');
  }, []);

  const searchDatabase = useCallback(
    (query: string, options?: SearchDatabaseOptions) => {
      const opts: SearchDatabaseOptions = {
        ...options,
        citizenId: currentUser.role === 'citizen' ? currentUser.id : options?.citizenId,
      };
      return globalSearchService.searchDatabase(query, opts);
    },
    [currentUser]
  );
  const [aiProviderType, setAiProviderType] = useState<'Gemini' | 'Demo AI'>(() =>
    aiService.getActiveProviderType()
  );

  // Check AI provider availability on mount
  useEffect(() => {
    aiService.checkProviderAvailability().then((type) => {
      setAiProviderType(type);
    });
  }, []);

  // Fetch authoritative data feeds from Express backend
  useEffect(() => {
    civicApiClient
      .getAllComplaints()
      .then((data) => {
        if (data?.complaints && Array.isArray(data.complaints) && data.complaints.length > 0) {
          complaintService.saveAll(data.complaints);
          setAllComplaintsList(data.complaints);
        }
      })
      .catch((err) => {
        console.warn('[AppContext] Civic backend complaints sync notice:', err?.message || err);
      });

    civicApiClient
      .getNotifications()
      .then((data) => {
        if (data?.notifications && Array.isArray(data.notifications)) {
          notificationService.saveAll(data.notifications);
          setNotificationsList(data.notifications);
        }
      })
      .catch((err) => {
        console.warn('[AppContext] Civic backend notifications sync notice:', err?.message || err);
      });

    civicApiClient
      .getHotspots()
      .then((data) => {
        if (data?.hotspots && Array.isArray(data.hotspots)) {
          setHotspotsList(data.hotspots);
        }
      })
      .catch((err) => {
        console.warn('[AppContext] Civic backend hotspots sync notice:', err?.message || err);
      });

    if (currentUser.role === 'admin') {
      civicApiClient
        .getAdminInsights()
        .then((data) => {
          if (data?.insights && Array.isArray(data.insights)) {
            insightService.saveAll(data.insights);
            setInsightsList(data.insights);
          }
        })
        .catch((err) => {
          console.warn('[AppContext] Civic backend insights sync notice:', err?.message || err);
        });
    }
  }, [currentUser.id, currentUser.role]);

  // Notifications mapped to current user
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(() =>
    notificationService.getForUser(currentUser.id, currentUser.role)
  );

  const refreshNotifications = useCallback(() => {
    setNotificationsList(notificationService.getForUser(currentUser.id, currentUser.role));
  }, [currentUser]);

  useEffect(() => {
    refreshNotifications();
  }, [currentUser, refreshNotifications]);

  // Auth Operations
  const setActivePersona = (persona: 'citizen' | 'admin') => {
    auth.login(persona);
  };

  const loginAs = (targetRole: 'citizen' | 'admin', customName?: string) => {
    const updated = auth.login(targetRole, customName);
    setIsAuthModalOpen(false);

    // Generate real session notification
    notificationService.add({
      userId: updated.role === 'admin' ? 'admin' : updated.id,
      title: `${updated.role === 'admin' ? 'Administrator' : 'Citizen'} Session Active`,
      message: `Signed in as ${updated.name} (${updated.title}).`,
      type: updated.role === 'admin' ? 'admin_action' : 'submission',
      link: updated.role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard',
    });
    refreshNotifications();
  };

  const logout = () => {
    auth.logout();
    refreshNotifications();
  };

  // Citizen Privacy Filtering:
  // If active role is 'citizen', `complaints` strictly exposes ONLY complaints authored by `currentUser.id`.
  // Admin role sees `allComplaintsList`.
  const complaints = useMemo(() => {
    if (currentUser.role === 'citizen') {
      return allComplaintsList.filter((c) => c.citizenId === currentUser.id);
    }
    return allComplaintsList;
  }, [allComplaintsList, currentUser]);

  const myComplaints = useMemo(() => {
    return allComplaintsList.filter((c) => c.citizenId === currentUser.id);
  }, [allComplaintsList, currentUser.id]);

  const getComplaintById = useCallback(
    (id: string): Complaint | undefined => {
      return complaintService.getById(id);
    },
    []
  );

  const getComplaintForCitizen = useCallback(
    (id: string, citizenId: string): Complaint | undefined => {
      return complaintService.getByIdForCitizen(id, citizenId);
    },
    []
  );

  // 1. Submit Complaint (Citizen Action)
  // Calls authoritative Express backend first. No local complaint created until server returns success.
  const submitComplaint = async (data: {
    title?: string;
    description: string;
    category: ComplaintCategory;
    severity: SeverityLevel;
    location: LocationCoordinates;
    image?: string;
    citizenName?: string;
    citizenPhone?: string;
  }): Promise<Complaint> => {
    // 1. Run local AI pre-assessment heuristic for immediate category/priority defaults
    const existing = complaintService.getAll();
    const aiAnalysis = aiService.analyzeComplaintSync(
      data.description,
      data.category,
      data.severity,
      data.location,
      existing
    );

    // 2. Post directly to authoritative civic API on the Express backend
    const apiResponse = await civicApiClient.createComplaint({
      title:
        data.title ||
        `${data.category} reported near ${data.location.landmark || data.location.address}`,
      description: data.description,
      category: data.category,
      severity: data.severity,
      priority: aiAnalysis.priority,
      citizenPhone: data.citizenPhone || undefined,
      location: data.location,
      aiAnalysis: {
        category: aiAnalysis.category,
        priority: aiAnalysis.priority,
        department: aiAnalysis.department,
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.reasoning,
        factors: aiAnalysis.factors,
        provider: aiAnalysis.provider,
        providerLabel: aiAnalysis.providerLabel,
      },
    });

    const authoritative = apiResponse.complaint as Complaint;

    // 3. Update local state with authoritative server record
    complaintService.create(authoritative);
    const updatedAll = complaintService.getAll();
    setAllComplaintsList(updatedAll);
    setLastSubmittedComplaint(authoritative);

    // 4. Update dynamic hotspots & insights
    const updatedHotspots = hotspotService.detectClusters(updatedAll);
    setHotspotsList(updatedHotspots);
    const updatedInsights = insightService.generateFromComplaints(updatedAll);
    setInsightsList(updatedInsights);

    // 5. Dispatch notification via backend API
    civicApiClient
      .createNotification({
        userId: currentUser.id,
        title: `Complaint Submitted: ${authoritative.id}`,
        message: `Your report for "${data.category}" has been logged into the municipal registry.`,
        type: 'submission',
        link: `/track?id=${authoritative.id}`,
      })
      .catch((e) => console.warn('[AppContext] Notification dispatch notice:', e));

    refreshNotifications();
    return authoritative;
  };

  // 2. Human-in-the-Loop: Ratify AI Recommendation
  // Server-authoritative: calls backend review API first; updates state from server response
  const ratifyAIRecommendation = async (id: string, adminNotes?: string) => {
    try {
      const res = await civicApiClient.reviewAIRecommendation(id, {
        decision: 'ratified',
        notes: adminNotes,
      });

      const updated = res.complaint as Complaint;
      if (updated) {
        complaintService.update(id, updated);
        const updatedAll = complaintService.getAll();
        setAllComplaintsList(updatedAll);
        setHotspotsList(hotspotService.detectClusters(updatedAll));
      }

      // Citizen notification via backend
      if (updated?.citizenId) {
        civicApiClient
          .createNotification({
            userId: updated.citizenId,
            title: `Work Order Assigned: ${id}`,
            message: `Your complaint has been reviewed and assigned to ${updated.assignedDepartment || updated.department}.`,
            type: 'assigned',
            link: `/track?id=${id}`,
          })
          .catch((err) => console.warn('[AppContext] Notification dispatch notice:', err));
      }

      refreshNotifications();
    } catch (err: any) {
      console.error('[AppContext] Failed to ratify AI recommendation on server:', err);
      alert(`Server rejected ratification: ${err?.message || 'Unauthorized or server error'}`);
      throw err;
    }
  };

  // 3. Human-in-the-Loop: Override AI Recommendation
  // Server-authoritative: calls backend review and assign APIs; updates state from server response
  const overrideAIRecommendation = async (
    id: string,
    overrides: {
      category?: ComplaintCategory;
      priority?: PriorityLevel;
      department?: DepartmentName;
      officer?: string;
      notes?: string;
    }
  ) => {
    try {
      const existing = complaintService.getById(id);
      const category = overrides.category || existing?.category;
      const priority = overrides.priority || existing?.priority;
      const department = overrides.department || existing?.department;

      const res = await civicApiClient.reviewAIRecommendation(id, {
        decision: 'overridden',
        finalCategory: category,
        finalPriority: priority,
        assignedDepartment: department,
        notes: overrides.notes,
      });

      let updated = res.complaint as Complaint;

      if (overrides.officer && department) {
        const assignRes = await civicApiClient.assignDepartment(id, {
          department,
          officer: overrides.officer,
          notes: overrides.notes,
        });
        if (assignRes?.complaint) {
          updated = assignRes.complaint as Complaint;
        }
      }

      if (updated) {
        complaintService.update(id, updated);
        const updatedAll = complaintService.getAll();
        setAllComplaintsList(updatedAll);
        setHotspotsList(hotspotService.detectClusters(updatedAll));
      }

      // Notify citizen via backend
      if (updated?.citizenId) {
        civicApiClient
          .createNotification({
            userId: updated.citizenId,
            title: `Work Order Assigned: ${id}`,
            message: `Your complaint was reviewed by municipal officers and assigned to ${department}.`,
            type: 'assigned',
            link: `/track?id=${id}`,
          })
          .catch((err) => console.warn('[AppContext] Notification dispatch notice:', err));
      }

      refreshNotifications();
    } catch (err: any) {
      console.error('[AppContext] Failed to override AI recommendation on server:', err);
      alert(`Server rejected override: ${err?.message || 'Unauthorized or server error'}`);
      throw err;
    }
  };

  // 4. Update Complaint Details & Lifecycle Transitions
  // Server-authoritative: calls backend mutation first. Updates state only after server confirmation.
  const updateComplaintDetails = async (
    id: string,
    updates: Partial<Complaint>,
    auditNote?: string
  ) => {
    const existing = complaintService.getById(id);
    if (!existing) return;

    const prevStatus = existing.status;
    const newStatus = updates.status || prevStatus;

    try {
      let finalAuthoritative: Complaint | null = null;

      // 1. Department/Officer assignment change
      if (updates.department || updates.assignedDepartment || updates.assignedOfficer) {
        const targetDept = (updates.department || updates.assignedDepartment || existing.department) as any;
        const assignRes = await civicApiClient.assignDepartment(id, {
          department: targetDept,
          officer: updates.assignedOfficer || existing.assignedOfficer,
          notes: auditNote || updates.adminNotes,
        });
        if (assignRes?.complaint) {
          finalAuthoritative = assignRes.complaint as Complaint;
        }
      }

      // 2. Lifecycle Status Transitions
      if (updates.status && updates.status !== prevStatus) {
        if (updates.status === 'resolved') {
          const resolveRes = await civicApiClient.resolveComplaint(id, {
            resolutionDetails:
              updates.resolutionDetails ||
              auditNote ||
              'Municipal field repair inspected and officially verified by site supervisor.',
            officerSignature: updates.assignedOfficer || updates.resolvedBy || currentUser.name,
            overrideRationale: auditNote,
          });
          if (resolveRes?.complaint) {
            finalAuthoritative = resolveRes.complaint as Complaint;
          }
        } else {
          const statusRes = await civicApiClient.updateStatus(id, {
            status: updates.status,
            notes: updates.adminNotes || auditNote,
            overrideRationale: auditNote,
          });
          if (statusRes?.complaint) {
            finalAuthoritative = statusRes.complaint as Complaint;
          }
        }
      }

      // 3. Fallback or additional updates if neither status nor department assignment was mutated
      if (!finalAuthoritative) {
        finalAuthoritative = complaintService.update(id, updates) || existing;
      } else {
        complaintService.update(id, finalAuthoritative);
      }

      const allUpdated = complaintService.getAll();
      setAllComplaintsList(allUpdated);
      setHotspotsList(hotspotService.detectClusters(allUpdated));

      // 4. Notifications on status change
      if (updates.status && updates.status !== prevStatus && finalAuthoritative) {
        const isResolved = updates.status === 'resolved';
        const isInProgress = updates.status === 'in_progress';

        civicApiClient
          .createNotification({
            userId: finalAuthoritative.citizenId,
            title: isResolved
              ? `Complaint Resolved: ${id}`
              : isInProgress
              ? `Complaint In Progress: ${id}`
              : `Complaint Assigned: ${id}`,
            message: isResolved
              ? (updates.resolutionDetails || 'Your complaint has been repaired and verified by municipal inspection.')
              : isInProgress
              ? 'Municipal field operations crew is currently deployed on site.'
              : `Assigned to ${updates.department || existing.department} for scheduled resolution.`,
            type: isResolved ? 'resolved' : isInProgress ? 'in_progress' : 'assigned',
            link: `/track?id=${id}`,
          })
          .catch((e) => console.warn('[AppContext] Notification notice:', e));
      }

      refreshNotifications();
    } catch (err: any) {
      console.error('[AppContext] Authoritative update rejected by civic backend:', err);
      alert(`Server rejected update: ${err?.message || 'Invalid lifecycle transition or server error'}`);
      throw err;
    }
  };

  const updateComplaintStatus = (
    id: string,
    newStatus: ComplaintStatus,
    adminNotes?: string,
    resolutionDetails?: string
  ) => {
    updateComplaintDetails(
      id,
      {
        status: newStatus,
        adminNotes,
        ...(resolutionDetails ? { resolutionDetails } : {}),
      },
      adminNotes
    );
  };

  const updateComplaint = (id: string, updates: Partial<Complaint>) => {
    updateComplaintDetails(id, updates);
  };

  const resolveComplaint = (id: string, resolutionDetails?: string, overrideNote?: string) => {
    const existing = complaintService.getById(id);
    const now = new Date().toISOString();
    const verifier = currentUser.name;
    const finalResolution =
      resolutionDetails?.trim() ||
      'Municipal field repair inspected and officially verified by site supervisor.';
    const isOverride = existing?.status === 'submitted';

    updateComplaintDetails(
      id,
      {
        status: 'resolved',
        resolutionDetails: finalResolution,
        resolvedBy: verifier,
        resolvedAt: now,
      },
      isOverride
        ? (overrideNote || `Administrative Override: Direct resolution authorized by ${verifier}. Rationale: ${finalResolution}`)
        : `Verified on-site: ${finalResolution}`
    );
  };

  // Bulk / Batch Operations - Server-Authoritative
  const bulkAssignDepartment = async (
    ids: string[],
    department: DepartmentName,
    officer?: string,
    notes?: string
  ) => {
    if (!ids || ids.length === 0) return;

    for (const id of ids) {
      try {
        const res = await civicApiClient.assignDepartment(id, {
          department,
          officer,
          notes,
        });
        if (res?.complaint) {
          complaintService.update(id, res.complaint);
        }
      } catch (err) {
        console.warn(`[AppContext] Bulk assign failed for ${id}:`, err);
      }
    }

    const updatedAll = complaintService.getAll();
    setAllComplaintsList(updatedAll);
    setHotspotsList(hotspotService.detectClusters(updatedAll));
    refreshNotifications();
  };

  const bulkUpdateStatus = async (
    ids: string[],
    newStatus: ComplaintStatus,
    notes?: string,
    resolutionDetails?: string
  ) => {
    if (!ids || ids.length === 0) return;

    for (const id of ids) {
      try {
        if (newStatus === 'resolved') {
          const res = await civicApiClient.resolveComplaint(id, {
            resolutionDetails: resolutionDetails || notes || 'Verified and resolved by municipal administration.',
            officerSignature: currentUser.name,
            overrideRationale: notes,
          });
          if (res?.complaint) {
            complaintService.update(id, res.complaint);
          }
        } else {
          const res = await civicApiClient.updateStatus(id, {
            status: newStatus,
            notes,
            overrideRationale: notes,
          });
          if (res?.complaint) {
            complaintService.update(id, res.complaint);
          }
        }
      } catch (err) {
        console.warn(`[AppContext] Bulk status update failed for ${id}:`, err);
      }
    }

    const updatedAll = complaintService.getAll();
    setAllComplaintsList(updatedAll);
    setHotspotsList(hotspotService.detectClusters(updatedAll));
    refreshNotifications();
  };

  const bulkUpdatePriority = (
    ids: string[],
    priority: PriorityLevel,
    notes?: string
  ) => {
    if (!ids || ids.length === 0) return;
    const now = new Date().toISOString();

    ids.forEach((id) => {
      const existing = complaintService.getById(id);
      if (!existing) return;
      const timeline = [...existing.timeline];

      timeline.push({
        status: existing.status,
        timestamp: now,
        title: `Priority Adjusted to ${priority}`,
        description: notes || `Batch priority modified to ${priority} by administrator (${currentUser.name}).`,
        actor: currentUser.name,
        badgeType: 'admin',
      });

      complaintService.update(id, {
        priority,
        finalPriority: priority,
        adminNotes: notes ? (existing.adminNotes ? `${existing.adminNotes} | ${notes}` : notes) : existing.adminNotes,
        timeline,
      });
    });

    const updatedAll = complaintService.getAll();
    setAllComplaintsList(updatedAll);
    setHotspotsList(hotspotService.detectClusters(updatedAll));

    notificationService.add({
      userId: 'admin',
      title: `Batch Priority Updated`,
      message: `Priority set to ${priority} for ${ids.length} complaint${ids.length > 1 ? 's' : ''}.`,
      type: 'admin_action',
      link: '/admin/complaints',
    });
    refreshNotifications();
  };

  const bulkRatifyAIRecommendations = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;

    for (const id of ids) {
      try {
        const res = await civicApiClient.reviewAIRecommendation(id, {
          decision: 'ratified',
          notes: 'Batch ratified by administrator',
        });
        if (res?.complaint) {
          complaintService.update(id, res.complaint);
        }
      } catch (err) {
        console.warn(`[AppContext] Bulk ratify failed for ${id}:`, err);
      }
    }

    const updatedAll = complaintService.getAll();
    setAllComplaintsList(updatedAll);
    setHotspotsList(hotspotService.detectClusters(updatedAll));
    refreshNotifications();
  };

  // Hotspots Operations
  const recalculateHotspotsNow = async () => {
    try {
      const res = await civicApiClient.recalculateHotspots();
      if (res?.hotspots) {
        setHotspotsList(res.hotspots);
        refreshNotifications();
        return;
      }
    } catch (err) {
      console.warn('[AppContext] Recalculate hotspots server notice:', err);
    }
    const updated = hotspotService.detectClusters(allComplaintsList);
    setHotspotsList(updated);
    refreshNotifications();
  };

  // Insights Operations - Admin Only
  const updateInsightStatus = async (
    id: string,
    status: 'new' | 'reviewed' | 'action_taken' | 'dismissed'
  ) => {
    try {
      await civicApiClient.updateInsightStatus(id, status);
    } catch (err) {
      console.warn('[AppContext] Update insight status server notice:', err);
    }
    insightService.updateStatus(id, status);
    setInsightsList(insightService.getAll());
  };

  const applyInsightAction = async (id: string, actionNote: string) => {
    const ins = insightService.getById(id);
    if (!ins) return;

    try {
      await civicApiClient.updateInsightStatus(id, 'action_taken', actionNote);
    } catch (err) {
      console.warn('[AppContext] Apply insight action server notice:', err);
    }
    insightService.updateStatus(id, 'action_taken');
    setInsightsList(insightService.getAll());

    civicApiClient
      .createNotification({
        userId: 'admin',
        title: 'Preventative Work Order Created',
        message: `Action recorded for insight: "${ins.title}". Department dispatch requested.`,
        type: 'admin_action',
        link: '/admin/insights',
      })
      .catch(() => {});

    refreshNotifications();
  };

  const dismissInsight = async (id: string) => {
    try {
      await civicApiClient.updateInsightStatus(id, 'dismissed');
    } catch (err) {
      console.warn('[AppContext] Dismiss insight server notice:', err);
    }
    insightService.updateStatus(id, 'dismissed');
    setInsightsList(insightService.getAll());
  };

  // Notifications Operations
  const markNotificationRead = async (id: string) => {
    try {
      await civicApiClient.markNotificationRead(id);
    } catch (err) {
      console.warn('[AppContext] Mark notification read server notice:', err);
    }
    notificationService.markAsRead(id);
    refreshNotifications();
  };

  const clearAllNotifications = async () => {
    try {
      await civicApiClient.clearAllNotifications();
    } catch (err) {
      console.warn('[AppContext] Clear notifications server notice:', err);
    }
    notificationService.clear(currentUser.role === 'admin' ? 'admin' : currentUser.id);
    refreshNotifications();
  };

  const unreadNotificationCount = notificationsList.filter((n) => !n.read).length;

  // Reset to initial clean state
  const resetToDefaults = () => {
    const resetComplaints = complaintService.reset();
    const resetHotspots = hotspotService.reset();
    const resetInsights = insightService.reset();
    const resetNotifs = notificationService.reset();
    const resetDepts = departmentService.reset();

    setAllComplaintsList(resetComplaints);
    setHotspotsList(resetHotspots);
    setInsightsList(resetInsights);
    setNotificationsList(resetNotifs);
    setDepartmentsList(resetDepts);
    setLastSubmittedComplaint(null);
  };

  const resetData = resetToDefaults;

  return (
    <AppContext.Provider
      value={{
        complaints,
        allComplaints: allComplaintsList,
        myComplaints,
        lastSubmittedComplaint,
        getComplaintById,
        getComplaintForCitizen,
        searchDatabase,
        isCommandBarOpen,
        setIsCommandBarOpen,
        commandBarInitialQuery,
        openCommandBar,
        closeCommandBar,
        submitComplaint,
        ratifyAIRecommendation,
        overrideAIRecommendation,
        updateComplaintStatus,
        updateComplaintDetails,
        updateComplaint,
        resolveComplaint,
        bulkAssignDepartment,
        bulkUpdateStatus,
        bulkUpdatePriority,
        bulkRatifyAIRecommendations,
        hotspots: hotspotsList,
        recalculateHotspotsNow,
        aiInsights: insightsList,
        updateInsightStatus,
        applyInsightAction,
        dismissInsight,
        departments: departmentsList,
        currentUser,
        role: auth.role,
        isAuthenticated: auth.isAuthenticated,
        activePersona: currentUser.role,
        setActivePersona,
        loginAs,
        login: loginAs,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isShortcutsModalOpen,
        setIsShortcutsModalOpen,
        notifications: notificationsList,
        unreadNotificationCount,
        markNotificationRead,
        clearAllNotifications,
        aiProviderType,
        aiProviderLabel: aiService.getActiveProviderLabel(),
        resetToDefaults,
        resetData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
