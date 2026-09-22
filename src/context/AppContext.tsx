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
  }) => Complaint;

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
  resolveComplaint: (id: string, resolutionDetails?: string) => void;

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
  // AI analyzes and offers recommendation. Complaint starts in 'submitted' with 'pending' review.
  const submitComplaint = (data: {
    title?: string;
    description: string;
    category: ComplaintCategory;
    severity: SeverityLevel;
    location: LocationCoordinates;
    image?: string;
    citizenName?: string;
    citizenPhone?: string;
  }): Complaint => {
    const existing = complaintService.getAll();
    const existingNumbers = existing
      .map((c) => {
        const match = c.id.match(/^SC(\d+)$/);
        return match ? parseInt(match[1], 10) : 1000;
      })
      .filter((n) => !isNaN(n));
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1025;
    const newId = `SC${nextNumber}`;

    // Run AI recommendation (decision support)
    const aiAnalysis = aiService.analyzeComplaintSync(
      data.description,
      data.category,
      data.severity,
      data.location,
      existing
    );

    const now = new Date().toISOString();

    const newComplaint: Complaint = {
      id: newId,
      title:
        data.title ||
        `${data.category} reported near ${data.location.landmark || data.location.address}`,
      description: data.description,
      category: data.category,
      severity: data.severity,
      citizenId: currentUser.id, // Enforces citizen privacy

      // AI Decision Support
      aiCategory: aiAnalysis.category,
      aiPriority: aiAnalysis.priority,
      aiDepartment: aiAnalysis.department,
      aiConfidence: aiAnalysis.confidence ?? 0.88,
      aiReasoning: aiAnalysis.reasoning,
      aiFactors: aiAnalysis.factors,
      aiProvider: aiAnalysis.provider,
      aiTimestamp: aiAnalysis.timestamp,

      // Administrative Decision: Pending review
      reviewDecision: 'pending',
      finalCategory: undefined,
      finalPriority: undefined,
      assignedDepartment: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,

      location: data.location,
      image: data.image,
      status: 'submitted',
      priority: undefined,
      department: undefined,
      citizenName: data.citizenName || currentUser.name,
      citizenPhone: data.citizenPhone || currentUser.phone || '+91 98260 12345',
      createdAt: now,
      updatedAt: now,
      adminNotes: 'Registered and placed in municipal intake triage queue awaiting administrative review.',
      timeline: [
        {
          status: 'submitted',
          timestamp: now,
          title: 'Complaint Registered',
          description: `Citizen submitted complaint for "${data.category}". Tracking reference: ${newId}.`,
          actor: data.citizenName || currentUser.name,
          badgeType: 'citizen',
        },
        {
          status: 'submitted',
          timestamp: new Date(Date.now() + 500).toISOString(),
          title: 'AI Decision-Support Recommendation Generated',
          description: `AI triage analyzed report: Recommended Category "${aiAnalysis.category}", Priority "${aiAnalysis.priority}", Department "${aiAnalysis.department}" (Confidence: ${aiAnalysis.confidencePercent}%). Human administrative validation pending.`,
          actor: aiAnalysis.providerLabel || 'Demo AI',
          badgeType: 'ai',
        },
      ],
    };

    const saved = complaintService.create(newComplaint);
    const updatedAll = complaintService.getAll();
    setAllComplaintsList(updatedAll);
    setLastSubmittedComplaint(saved);

    // Dynamically run DBSCAN hotspot clustering
    const updatedHotspots = hotspotService.detectClusters(updatedAll);
    setHotspotsList(updatedHotspots);

    // Dynamically generate AI Insights
    const updatedInsights = insightService.generateFromComplaints(updatedAll);
    setInsightsList(updatedInsights);

    // Notifications
    // 1. For citizen
    notificationService.add({
      userId: currentUser.id,
      title: `Complaint Registered: ${newId}`,
      message: `Your report for "${data.category}" has been received and queued for review.`,
      type: 'submission',
      link: `/track?id=${newId}`,
    });

    // 2. For admin
    notificationService.add({
      userId: 'admin',
      title: `Admin Review Required: ${newId}`,
      message: `Citizen filed ${data.severity} severity issue. AI recommends ${aiAnalysis.priority} priority to ${aiAnalysis.department}.`,
      type: 'admin_action',
      link: `/admin/complaint/${newId}`,
    });

    refreshNotifications();
    return saved;
  };

  // 2. Human-in-the-Loop: Ratify AI Recommendation
  const ratifyAIRecommendation = (id: string, adminNotes?: string) => {
    const existing = complaintService.getById(id);
    if (!existing) return;

    const now = new Date().toISOString();
    const timeline = [...existing.timeline];

    timeline.push({
      status: 'assigned',
      timestamp: now,
      title: 'AI Recommendation Ratified by Administrator',
      description:
        adminNotes ||
        `Administrator (${currentUser.name}) reviewed and ratified the AI decision support. Formally assigned to ${existing.aiDepartment} with ${existing.aiPriority} priority.`,
      actor: currentUser.name,
      badgeType: 'admin',
    });

    const updated = complaintService.update(id, {
      status: 'assigned',
      finalCategory: existing.aiCategory,
      finalPriority: existing.aiPriority,
      assignedDepartment: existing.aiDepartment,
      priority: existing.aiPriority,
      department: existing.aiDepartment,
      reviewedBy: currentUser.name,
      reviewedAt: now,
      reviewDecision: 'ratified',
      adminNotes: adminNotes || `Ratified AI recommendation on ${new Date().toLocaleDateString()}. Assigned to ${existing.aiDepartment}.`,
      timeline,
    });

    if (updated) {
      setAllComplaintsList(complaintService.getAll());

      // Citizen notification
      notificationService.add({
        userId: existing.citizenId,
        title: `Work Order Assigned: ${id}`,
        message: `Your complaint has been reviewed and assigned to ${existing.aiDepartment}.`,
        type: 'assigned',
        link: `/track?id=${id}`,
      });

      // Admin notification
      notificationService.add({
        userId: 'admin',
        title: `Complaint ${id} Assigned`,
        message: `Ratified AI recommendation. Work order issued to ${existing.aiDepartment}.`,
        type: 'admin_action',
        link: `/admin/complaint/${id}`,
      });

      refreshNotifications();
    }
  };

  // 3. Human-in-the-Loop: Override AI Recommendation
  const overrideAIRecommendation = (
    id: string,
    overrides: {
      category?: ComplaintCategory;
      priority?: PriorityLevel;
      department?: DepartmentName;
      officer?: string;
      notes?: string;
    }
  ) => {
    const existing = complaintService.getById(id);
    if (!existing) return;

    const now = new Date().toISOString();
    const timeline = [...existing.timeline];

    const category = overrides.category || existing.category;
    const priority = overrides.priority || existing.priority;
    const department = overrides.department || existing.department;

    timeline.push({
      status: 'assigned',
      timestamp: now,
      title: 'Administrative Decision (AI Recommendation Overridden)',
      description:
        overrides.notes ||
        `Administrator (${currentUser.name}) applied human discretion: Set Category "${category}", Priority "${priority}", Assigned Department "${department}"${
          overrides.officer ? ` (Officer: ${overrides.officer})` : ''
        }.`,
      actor: currentUser.name,
      badgeType: 'admin',
    });

    const updated = complaintService.update(id, {
      status: 'assigned',
      finalCategory: category,
      finalPriority: priority,
      assignedDepartment: department,
      category,
      priority,
      department,
      assignedOfficer: overrides.officer || existing.assignedOfficer,
      reviewedBy: currentUser.name,
      reviewedAt: now,
      reviewDecision: 'overridden',
      adminNotes: overrides.notes || `Administrative override: ${priority} priority, assigned to ${department}.`,
      timeline,
    });

    if (updated) {
      setAllComplaintsList(complaintService.getAll());

      // Notify citizen
      notificationService.add({
        userId: existing.citizenId,
        title: `Work Order Assigned: ${id}`,
        message: `Your complaint was reviewed by municipal officers and assigned to ${department}.`,
        type: 'assigned',
        link: `/track?id=${id}`,
      });

      // Notify admin
      notificationService.add({
        userId: 'admin',
        title: `Complaint ${id} Overridden & Assigned`,
        message: `Admin applied override: ${priority} priority -> ${department}.`,
        type: 'admin_action',
        link: `/admin/complaint/${id}`,
      });

      refreshNotifications();
    }
  };

  // 4. Update Complaint Details & Lifecycle Transitions
  const updateComplaintDetails = (
    id: string,
    updates: Partial<Complaint>,
    auditNote?: string
  ) => {
    const existing = complaintService.getById(id);
    if (!existing) return;

    const now = new Date().toISOString();
    const timeline = [...existing.timeline];
    const prevStatus = existing.status;
    const newStatus = updates.status || prevStatus;

    // Strict Lifecycle state progression
    if (updates.status && updates.status !== prevStatus) {
      if (newStatus === 'assigned') {
        timeline.push({
          status: 'assigned',
          timestamp: now,
          title: `Work Order Assigned to ${updates.department || existing.department}`,
          description:
            auditNote ||
            `Complaint assigned to ${updates.department || existing.department}${
              updates.assignedOfficer ? ` (Officer: ${updates.assignedOfficer})` : ''
            }.`,
          actor: currentUser.name,
          badgeType: 'admin',
        });
      } else if (newStatus === 'in_progress') {
        timeline.push({
          status: 'in_progress',
          timestamp: now,
          title: 'Field Crew Dispatched (In Progress)',
          description:
            auditNote ||
            `Municipal field team from ${
              updates.department || existing.department
            } deployed on site for inspection and repair.`,
          actor: updates.assignedOfficer || 'Municipal Field Operations',
          badgeType: 'department',
        });
      } else if (newStatus === 'resolved') {
        timeline.push({
          status: 'resolved',
          timestamp: now,
          title: 'Issue Resolved & Verified',
          description:
            updates.resolutionDetails ||
            auditNote ||
            'Field repair completed and verified by municipal inspection supervisor.',
          actor: currentUser.name,
          badgeType: 'admin',
        });
      }
    }

    if (auditNote && !updates.status) {
      timeline.push({
        status: newStatus,
        timestamp: now,
        title: 'Administrative Note Added',
        description: auditNote,
        actor: currentUser.name,
        badgeType: 'admin',
      });
    }

    const updated = complaintService.update(id, {
      ...updates,
      timeline,
      ...(updates.status === 'resolved'
        ? { resolvedAt: now, resolvedBy: currentUser.name }
        : {}),
    });

    if (updated) {
      const allUpdated = complaintService.getAll();
      setAllComplaintsList(allUpdated);

      // Trigger dynamic clustering
      const updatedHotspots = hotspotService.detectClusters(allUpdated);
      setHotspotsList(updatedHotspots);

      // Notifications on status change
      if (updates.status && updates.status !== prevStatus) {
        // Citizen notification
        notificationService.add({
          userId: existing.citizenId,
          title: `Status Update: ${id} is ${updates.status.replace('_', ' ').toUpperCase()}`,
          message: auditNote || `Your complaint status has moved to ${updates.status.replace('_', ' ')}.`,
          type: updates.status === 'resolved' ? 'resolved' : updates.status === 'in_progress' ? 'in_progress' : 'assigned',
          link: `/track?id=${id}`,
        });

        // Admin notification
        notificationService.add({
          userId: 'admin',
          title: `Complaint ${id} Updated`,
          message: `Status transitioned from ${prevStatus} to ${updates.status}.`,
          type: 'admin_action',
          link: `/admin/complaint/${id}`,
        });

        refreshNotifications();
      }
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

  const resolveComplaint = (id: string, resolutionDetails?: string) => {
    updateComplaintStatus(
      id,
      'resolved',
      undefined,
      resolutionDetails || 'Municipal repair completed and verified on site.'
    );
  };

  // Bulk / Batch Operations
  const bulkAssignDepartment = (
    ids: string[],
    department: DepartmentName,
    officer?: string,
    notes?: string
  ) => {
    if (!ids || ids.length === 0) return;
    const now = new Date().toISOString();

    ids.forEach((id) => {
      const existing = complaintService.getById(id);
      if (!existing) return;
      const timeline = [...existing.timeline];
      const newStatus: ComplaintStatus = existing.status === 'submitted' ? 'assigned' : existing.status;

      timeline.push({
        status: newStatus,
        timestamp: now,
        title: `Bulk Assigned to ${department}`,
        description: notes || `Batch assignment by administrator (${currentUser.name}): Assigned to ${department}${officer ? ` (Officer: ${officer})` : ''}.`,
        actor: currentUser.name,
        badgeType: 'admin',
      });

      complaintService.update(id, {
        department,
        assignedDepartment: department,
        status: newStatus,
        assignedOfficer: officer || existing.assignedOfficer || 'Municipal Field Operations',
        adminNotes: notes ? (existing.adminNotes ? `${existing.adminNotes} | ${notes}` : notes) : existing.adminNotes,
        reviewedBy: currentUser.name,
        reviewedAt: now,
        timeline,
      });

      // Citizen notification
      notificationService.add({
        userId: existing.citizenId,
        title: `Work Order Assigned: ${id}`,
        message: `Your complaint was assigned to ${department}.`,
        type: 'assigned',
        link: `/track?id=${id}`,
      });
    });

    const updatedAll = complaintService.getAll();
    setAllComplaintsList(updatedAll);
    setHotspotsList(hotspotService.detectClusters(updatedAll));

    notificationService.add({
      userId: 'admin',
      title: `Batch Assignment Completed`,
      message: `Assigned ${ids.length} complaint${ids.length > 1 ? 's' : ''} to ${department}.`,
      type: 'admin_action',
      link: '/admin/complaints',
    });
    refreshNotifications();
  };

  const bulkUpdateStatus = (
    ids: string[],
    newStatus: ComplaintStatus,
    notes?: string,
    resolutionDetails?: string
  ) => {
    if (!ids || ids.length === 0) return;
    const now = new Date().toISOString();

    ids.forEach((id) => {
      const existing = complaintService.getById(id);
      if (!existing) return;
      const timeline = [...existing.timeline];
      const statusTitle =
        newStatus === 'resolved'
          ? 'Issue Resolved via Batch Action'
          : newStatus === 'in_progress'
          ? 'Field Crew Dispatched (Batch)'
          : newStatus === 'assigned'
          ? 'Assigned via Batch Action'
          : 'Status Set to Submitted';

      timeline.push({
        status: newStatus,
        timestamp: now,
        title: statusTitle,
        description:
          resolutionDetails ||
          notes ||
          `Status transitioned to ${newStatus.replace('_', ' ')} by administrator (${currentUser.name}).`,
        actor: currentUser.name,
        badgeType: 'admin',
      });

      complaintService.update(id, {
        status: newStatus,
        ...(newStatus === 'resolved'
          ? {
              resolvedAt: now,
              resolvedBy: currentUser.name,
              resolutionDetails: resolutionDetails || notes || 'Verified and resolved by municipal administration.',
            }
          : {}),
        adminNotes: notes ? (existing.adminNotes ? `${existing.adminNotes} | ${notes}` : notes) : existing.adminNotes,
        timeline,
      });

      notificationService.add({
        userId: existing.citizenId,
        title: `Status Update: ${id} is ${newStatus.replace('_', ' ').toUpperCase()}`,
        message: notes || `Your complaint status has moved to ${newStatus.replace('_', ' ')}.`,
        type: newStatus === 'resolved' ? 'resolved' : newStatus === 'in_progress' ? 'in_progress' : 'assigned',
        link: `/track?id=${id}`,
      });
    });

    const updatedAll = complaintService.getAll();
    setAllComplaintsList(updatedAll);
    setHotspotsList(hotspotService.detectClusters(updatedAll));

    notificationService.add({
      userId: 'admin',
      title: `Batch Status Updated`,
      message: `${ids.length} complaint${ids.length > 1 ? 's' : ''} moved to ${newStatus.replace('_', ' ')}.`,
      type: 'admin_action',
      link: '/admin/complaints',
    });
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

  const bulkRatifyAIRecommendations = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const now = new Date().toISOString();

    ids.forEach((id) => {
      const existing = complaintService.getById(id);
      if (!existing) return;
      const timeline = [...existing.timeline];

      timeline.push({
        status: 'assigned',
        timestamp: now,
        title: 'AI Recommendation Ratified in Bulk',
        description: `Administrator (${currentUser.name}) batch-ratified AI recommendation: ${existing.aiDepartment}, ${existing.aiPriority} priority.`,
        actor: currentUser.name,
        badgeType: 'admin',
      });

      complaintService.update(id, {
        status: 'assigned',
        finalCategory: existing.aiCategory,
        finalPriority: existing.aiPriority,
        assignedDepartment: existing.aiDepartment,
        priority: existing.aiPriority,
        department: existing.aiDepartment,
        reviewedBy: currentUser.name,
        reviewedAt: now,
        reviewDecision: 'ratified',
        timeline,
      });

      notificationService.add({
        userId: existing.citizenId,
        title: `Work Order Assigned: ${id}`,
        message: `Your complaint was reviewed and assigned to ${existing.aiDepartment}.`,
        type: 'assigned',
        link: `/track?id=${id}`,
      });
    });

    const updatedAll = complaintService.getAll();
    setAllComplaintsList(updatedAll);
    setHotspotsList(hotspotService.detectClusters(updatedAll));

    notificationService.add({
      userId: 'admin',
      title: `Batch AI Ratification Complete`,
      message: `Ratified AI recommendations for ${ids.length} complaint${ids.length > 1 ? 's' : ''}.`,
      type: 'admin_action',
      link: '/admin/complaints',
    });
    refreshNotifications();
  };

  // Hotspots Operations
  const recalculateHotspotsNow = () => {
    const updated = hotspotService.detectClusters(allComplaintsList);
    setHotspotsList(updated);

    notificationService.add({
      userId: 'admin',
      title: 'Geospatial Hotspots Recalculated',
      message: `DBSCAN cluster analysis refreshed across all ${allComplaintsList.length} active complaints.`,
      type: 'hotspot',
      link: '/admin/hotspots',
    });
    refreshNotifications();
  };

  // Insights Operations
  const updateInsightStatus = (
    id: string,
    status: 'new' | 'reviewed' | 'action_taken' | 'dismissed'
  ) => {
    insightService.updateStatus(id, status);
    setInsightsList(insightService.getAll());
  };

  const applyInsightAction = (id: string, actionNote: string) => {
    const ins = insightService.getById(id);
    if (!ins) return;

    insightService.updateStatus(id, 'action_taken');
    setInsightsList(insightService.getAll());

    notificationService.add({
      userId: 'admin',
      title: 'Preventative Work Order Created',
      message: `Action recorded for insight: "${ins.title}". Department dispatch requested.`,
      type: 'admin_action',
      link: '/admin/insights',
    });
    refreshNotifications();
  };

  const dismissInsight = (id: string) => {
    insightService.updateStatus(id, 'dismissed');
    setInsightsList(insightService.getAll());
  };

  // Notifications Operations
  const markNotificationRead = (id: string) => {
    notificationService.markAsRead(id);
    refreshNotifications();
  };

  const clearAllNotifications = () => {
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
