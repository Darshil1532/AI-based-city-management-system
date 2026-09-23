import {
  ComplaintCategory,
  SeverityLevel,
  PriorityLevel,
  DepartmentName,
  LocationCoordinates,
  Complaint,
} from '../../types';

export type AIProviderType = 'Gemini' | 'Demo AI';

export interface AIAnalysisResult {
  category: ComplaintCategory;
  priority: PriorityLevel;
  department: DepartmentName;
  confidence?: number; // 0.0 to 1.0 (e.g. 0.94)
  confidencePercent?: number; // 0 to 100
  reasoning: string;
  factors: string[];
  publicImpactScore: number; // 1 to 10
  urgencyIndicators: string[];
  provider: AIProviderType;
  providerLabel: string;
  timestamp: string;
  isHeuristicPreview?: boolean;
}

export interface AIInsightPattern {
  title: string;
  detectedPattern: string;
  recommendation: string;
  priority: PriorityLevel;
  department: DepartmentName;
  suggestedDepartment: DepartmentName;
  location: string;
  relatedComplaintIds: string[];
  potentialCauseHypothesis: string;
  estimatedImpact: string;
  disclaimer?: string;
}

export interface IAIProvider {
  name: AIProviderType;
  label: string;
  isAvailable(): Promise<boolean>;
  classifyComplaint(
    description: string,
    userCategory?: ComplaintCategory,
    userSeverity?: SeverityLevel,
    location?: LocationCoordinates,
    existingComplaints?: Complaint[]
  ): Promise<AIAnalysisResult>;
  generateInsights(complaints: Complaint[]): Promise<AIInsightPattern[]>;
}
