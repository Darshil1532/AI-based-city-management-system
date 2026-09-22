export type ComplaintCategory =
  | 'Pothole / Road'
  | 'Garbage / Waste'
  | 'Water Leakage'
  | 'Streetlight'
  | 'Traffic'
  | 'Infrastructure'
  | 'Other';

export type SeverityLevel = 'Low' | 'Medium' | 'High';

export type PriorityLevel = 'Low' | 'Medium' | 'High';

export type ComplaintStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved';

export type DepartmentName =
  | 'Public Works Department'
  | 'Sanitation Department'
  | 'Water Supply Department'
  | 'Electrical Department'
  | 'Traffic & Transit Department'
  | 'Urban Infrastructure Division'
  | 'General Municipal Administration';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  district?: string;
}

export interface TimelineEvent {
  status: ComplaintStatus;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
  badgeType?: 'system' | 'ai' | 'admin' | 'department' | 'citizen';
}

export interface AIAnalysis {
  category: ComplaintCategory;
  priority: PriorityLevel;
  department: DepartmentName;
  confidence: number; // e.g. 0.94
  confidencePercent?: number;
  reasoning: string;
  factors: string[];
  publicImpactScore: number; // 1 to 10
  similarNearbyCount?: number;
  urgencyIndicators?: string[];
  provider?: 'Gemini' | 'Demo AI';
  providerLabel?: string;
  timestamp?: string;
}

export interface Complaint {
  id: string; // e.g., 'SC1024'
  title: string;
  description: string;
  category: ComplaintCategory;
  severity: SeverityLevel;
  citizenId: string; // Enforces citizen privacy - citizen only views own complaints
  
  // AI Decision-Support Recommendation (Strictly separate from Administrative Decision)
  aiCategory: ComplaintCategory;
  aiPriority: PriorityLevel;
  aiDepartment: DepartmentName;
  aiConfidence: number;
  aiReasoning: string;
  aiFactors: string[];
  aiProvider?: 'Gemini' | 'Demo AI';
  aiTimestamp?: string;

  // Administrative Decision (Explicit Human-in-the-Loop review)
  finalCategory?: ComplaintCategory;
  finalPriority?: PriorityLevel;
  assignedDepartment?: DepartmentName;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewDecision?: 'ratified' | 'overridden' | 'pending';

  location: LocationCoordinates;
  image?: string;
  status: ComplaintStatus;
  priority: PriorityLevel;
  department: DepartmentName;
  assignedOfficer?: string;
  citizenName?: string;
  citizenPhone?: string;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  resolutionDetails?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  estimatedResolutionTime?: string;
  duplicateWarning?: {
    isSuspectedDuplicate: boolean;
    suspectedId?: string;
    similarityScore?: number;
  };
  timeline: TimelineEvent[];
}

export interface Hotspot {
  id: string;
  name: string;
  locationName: string;
  district?: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
  complaintCount: number;
  complaintIds: string[];
  mainCategories: { category: ComplaintCategory; count: number }[];
  timePeriod: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  severity?: 'Low' | 'Medium' | 'High';
  suggestedAction: string;
  status: 'active' | 'investigating' | 'addressed';
  lastDetected: string;
}

export interface AIInsight {
  id: string;
  title: string;
  detectedPattern: string;
  recommendation: string;
  aiRecommendation?: string;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  priority: PriorityLevel;
  relatedComplaintIds: string[];
  relatedComplaintsCount?: number;
  suggestedDepartment: DepartmentName;
  department?: string;
  status: 'new' | 'reviewed' | 'action_taken' | 'dismissed';
  date: string;
  potentialCauseHypothesis?: string;
  estimatedImpact?: string;
}

export interface DepartmentInfo {
  id: string;
  name: DepartmentName;
  head: string;
  headOfDepartment?: string;
  description?: string;
  contactEmail: string;
  email?: string;
  contactPhone?: string;
  activeComplaints: number;
  resolvedComplaints: number;
  avgResolutionHours: number;
  efficiencyScore: number;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'citizen' | 'admin';
  email: string;
  phone?: string;
  title: string;
  badge?: string;
  department?: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // 'CIT-DEMO-01' or 'admin' or 'all'
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type:
    | 'submission'
    | 'ai_alert'
    | 'admin_action'
    | 'hotspot'
    | 'assigned'
    | 'in_progress'
    | 'resolved';
  link?: string;
}

export interface ComplaintSearchResult {
  item: Complaint;
  matchedFields: string[];
  snippet?: string;
  score: number;
}

export interface DepartmentSearchResult {
  item: DepartmentInfo;
  matchedFields: string[];
  snippet?: string;
  score: number;
}

export interface GlobalSearchResults {
  query: string;
  complaints: ComplaintSearchResult[];
  departments: DepartmentSearchResult[];
  totalMatches: number;
}

