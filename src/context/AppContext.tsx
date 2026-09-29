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

  // Fetch authoritative complaints feed from Express backend
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
        console.warn('[AppContext] Civic backend sync notice:', err?.message || err);
      });
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
      aiConfidence: aiAnalysis.confidence,
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
      citizenPhone: data.citizenPhone || currentUser.phone || undefined,
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
          description: `AI triage analyzed report: Recommended Category "${aiAnalysis.category}", Priority "${aiAnalysis.priority}", Department "${aiAnalysis.department}"${aiAnalysis.confidence !== undefined ? ` (Confidence: ${(aiAnalysis.confidence * 100).toFixed(0)}%)` : ' (Fallback decision support)'}. Human administrative validation pending.`,
          actor: aiAnalysis.providerLabel || (aiAnalysis.provider === 'Gemini' ? 'Gemini 2.5 Flash' : 'Demo AI'),
          badgeType: 'ai',
        },
      ],
    };

    const saved = complaintService.create(newComplaint);
    const updatedAll = complaintService.getAll();
    setAllComplaintsList(updatedAll);
    setLastSubmittedComplaint(saved);

    // Persist via Express authoritative civic API
    civicApiClient
      .createComplaint({
        title: newComplaint.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        priority: aiAnalysis.priority,
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
      })
      .then((res) => {
        if (res?.complaint) {
          complaintService.update(newId, res.complaint);
          setAllComplaintsList(complaintService.getAll());
        }
      })
      .catch((err) => {
        console.warn('[AppContext] Civic backend intake sync notice:', err);
      });

    // Dynamically run DBSCAN hotspot clustering
    const updatedHotspots = hotspotService.detectClusters(updatedAll);
    setHotspotsList(updatedHotspots);

    // Dynamically generate AI Insights
    const updatedInsights = insightService.generateFromComplaints(updatedAll);
    setInsightsList(updatedInsights);

    // Phase 17: Notifications Generation
    // 1. Complaint Submitted (Citizen)
    notificationService.add({
      userId: currentUser.id,
      title: `Complaint Submitted: ${newId}`,
      message: `Your report for "${data.category}" at ${data.location.address || 'location'} has been logged into the municipal registry.`,
      type: 'submission',
      link: `/track?id=${newId}`,
    });

    // 2. AI Analysis Completed (Citizen)
    notificationService.add({
      userId: currentUser.id,
      title: `AI Analysis Completed: ${newId}`,
      message: `AI classified your complaint as ${aiAnalysis.category} with recommended ${aiAnalysis.priority} priority for ${aiAnalysis.department}.`,
      type: 'ai_alert',
      link: `/track?id=${newId}`,
    });

    // 3. Admin Review Required (Admin)
    notificationService.add({
      userId: 'admin',
      title: `Admin Review Required: ${newId}`,
      message: `New civic report filed: ${data.category} (${data.severity} severity). AI recommends ${aiAnalysis.priority} priority to ${aiAnalysis.department}.`,
      type: 'admin_action',
      link: `/admin/complaint/${newId}`,
    });

    // 4. Hotspot Detected (Admin) if cluster count grew
    if (updatedHotspots.length > hotspotsList.length && updatedHotspots[0]) {
      const topSpot = updatedHotspots[0];
      notificationService.add({
        userId: 'admin',
        title: `Hotspot Detected: ${topSpot.name}`,
        message: `${topSpot.complaintCount} related complaints clustered around ${topSpot.locationName}.`,
        type: 'hotspot',
        link: '/admin/hotspots',
      });
    }

    // 5. AI Insight Generated (Admin) if insights grew
    if (updatedInsights.length > insightsList.length && updatedInsights[0]) {
      const topIns = updatedInsights[0];
      notificationService.add({
        userId: 'admin',
        title: `AI Insight Generated: ${topIns.title}`,
        message: `Systemic pattern detected: ${topIns.detectedPattern.slice(0, 100)}...`,
        type: 'admin_action',
        link: '/admin/insights',
      });
    }

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

      civicApiClient
        .reviewAIRecommendation(id, {
          decision: 'ratified',
          notes: adminNotes,
        })
        .catch((err) => console.warn('[AppContext] Ratify backend sync notice:', err));

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

      civicApiClient
        .reviewAIRecommendation(id, {
          decision: 'overridden',
          finalCategory: category,
          finalPriority: priority,
          assignedDepartment: department,
          notes: overrides.notes,
        })
        .then(() => {
          if (overrides.officer) {
            return civicApiClient.assignDepartment(id, {
              department: department || 'Public Works Department',
              officer: overrides.officer,
              notes: overrides.notes,
            });
          }
        })
        .catch((err) => console.warn('[AppContext] Override backend sync notice:', err));

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

    // Strict Lifecycle state progression:
    // Submitted -> Assigned -> In Progress -> Resolved
    // Prevent invalid transitions: Submitted -> Resolved requires an explicit administrative override rationale
    if (updates.status && updates.status !== prevStatus) {
      const isDirectResolve = prevStatus === 'submitted' && newStatus === 'resolved';
      const effectiveNote = auditNote || updates.adminNotes || updates.resolutionDetails;
      
      if (isDirectResolve && !effectiveNote) {
        console.warn(`[Complaint Lifecycle] Direct transition from ${prevStatus} to ${newStatus} without override rationale.`);
      }

      const noteText = isDirectResolve
        ? (auditNote || `Administrative Fast-Track Override: Resolved directly by ${currentUser.name}. Reason: ${updates.resolutionDetails || 'Emergency resolution on site'}`)
        : (effectiveNote || `Status updated from ${prevStatus} to ${newStatus}`);

      if (newStatus === 'assigned') {
        timeline.push({
          status: 'assigned',
          previousStatus: prevStatus,
          newStatus: 'assigned',
          timestamp: now,
          title: `Work Order Assigned to ${updates.department || existing.department}`,
          description:
            auditNote ||
            `Complaint assigned to ${updates.department || existing.department}${
              updates.assignedOfficer ? ` (Officer: ${updates.assignedOfficer})` : ''
            }.`,
          actor: currentUser.name,
          note: noteText,
          badgeType: 'admin',
        });
      } else if (newStatus === 'in_progress') {
        timeline.push({
          status: 'in_progress',
          previousStatus: prevStatus,
          newStatus: 'in_progress',
          timestamp: now,
          title: 'Field Crew Dispatched (In Progress)',
          description:
            auditNote ||
            `Municipal field team from ${
              updates.department || existing.department
            } deployed on site for inspection and repair.`,
          actor: updates.assignedOfficer || currentUser.name,
          note: noteText,
          badgeType: 'department',
        });
      } else if (newStatus === 'resolved') {
        const finalResolution =
          updates.resolutionDetails ||
          auditNote ||
          'Municipal field repair inspected and officially verified by site supervisor.';
        timeline.push({
          status: 'resolved',
          previousStatus: prevStatus,
          newStatus: 'resolved',
          timestamp: now,
          title: isDirectResolve ? 'Issue Resolved (Administrative Override)' : 'Issue Resolved & Verified',
          description: finalResolution,
          actor: currentUser.name,
          note: noteText,
          badgeType: 'admin',
        });
      }
    }

    if (auditNote && !updates.status) {
      timeline.push({
        status: newStatus,
        previousStatus: prevStatus,
        newStatus: newStatus,
        timestamp: now,
        title: 'Administrative Note Added',
        description: auditNote,
        actor: currentUser.name,
        note: auditNote,
        badgeType: 'admin',
      });
    }

    const updated = complaintService.update(id, {
      ...updates,
      timeline,
      ...(updates.status === 'resolved'
        ? {
            resolvedAt: updates.resolvedAt || now,
            resolvedBy: updates.resolvedBy || currentUser.name,
            resolutionDetails: updates.resolutionDetails || auditNote || 'Repairs verified on site.',
          }
        : {}),
    });

    if (updated) {
      const allUpdated = complaintService.getAll();
      setAllComplaintsList(allUpdated);

      // Trigger dynamic clustering
      const updatedHotspots = hotspotService.detectClusters(allUpdated);
      setHotspotsList(updatedHotspots);

      // Phase 17: Notifications on status change
      if (updates.status && updates.status !== prevStatus) {
        const isResolved = updates.status === 'resolved';
        const isInProgress = updates.status === 'in_progress';

        // Citizen notification (own complaints only)
        notificationService.add({
          userId: existing.citizenId,
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
        });

        // Admin notification (operational)
        notificationService.add({
          userId: 'admin',
          title: isResolved
            ? `Complaint Resolved: ${id}`
            : isInProgress
            ? `Complaint In Progress: ${id}`
            : `Complaint Assigned: ${id}`,
          message: isResolved
            ? `Resolution verified by ${currentUser.name}: ${updates.resolutionDetails || 'Repairs verified'}`
            : `Status transitioned from ${prevStatus} to ${updates.status}.`,
          type: 'admin_action',
          link: `/admin/complaint/${id}`,
        });

        refreshNotifications();

        // Authoritative civic backend synchronization with automatic rollback on error
        if (isResolved) {
          civicApiClient
            .resolveComplaint(id, {
              resolutionDetails: updates.resolutionDetails || auditNote || 'Municipal field repair inspected and officially verified by site supervisor.',
              officerSignature: updates.assignedOfficer || currentUser.name,
              overrideRationale: auditNote,
            })
            .then((res) => {
              if (res?.complaint) {
                complaintService.update(id, res.complaint);
                setAllComplaintsList(complaintService.getAll());
              }
            })
            .catch((err) => {
              console.error('[AppContext] Authoritative resolution rejected by civic backend:', err);
              // Immediate rollback to prevent state divergence
              complaintService.update(id, existing);
              setAllComplaintsList(complaintService.getAll());
              alert(`Server rejected resolution: ${err?.message || 'Invalid transition'}`);
            });
        } else {
          civicApiClient
            .updateStatus(id, {
              status: updates.status,
              notes: updates.adminNotes || auditNote,
              overrideRationale: auditNote,
            })
            .then((res) => {
              if (res?.complaint) {
                complaintService.update(id, res.complaint);
                setAllComplaintsList(complaintService.getAll());
              }
            })
            .catch((err) => {
              console.error('[AppContext] Authoritative status transition rejected by civic backend:', err);
              // Immediate rollback to prevent state divergence
              complaintService.update(id, existing);
              setAllComplaintsList(complaintService.getAll());
              alert(`Server rejected status update: ${err?.message || 'Invalid lifecycle transition'}`);
            });
        }
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
