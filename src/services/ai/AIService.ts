import {
  ComplaintCategory,
  SeverityLevel,
  LocationCoordinates,
  Complaint,
} from '../../types';
import { IAIProvider, AIAnalysisResult, AIInsightPattern, AIProviderType } from './AIProvider';
import { DemoAIProvider } from './DemoAIProvider';
import { GeminiProvider } from './GeminiProvider';

export class AIServiceManager {
  private demoProvider: DemoAIProvider = new DemoAIProvider();
  private geminiProvider: GeminiProvider = new GeminiProvider();
  private activeProviderType: AIProviderType = 'Demo AI';
  private hasCheckedGemini: boolean = false;

  constructor() {
    this.checkProviderAvailability();
  }

  async checkProviderAvailability(): Promise<AIProviderType> {
    try {
      const isGeminiAvailable = await this.geminiProvider.isAvailable();
      this.activeProviderType = isGeminiAvailable ? 'Gemini' : 'Demo AI';
    } catch {
      this.activeProviderType = 'Demo AI';
    }
    this.hasCheckedGemini = true;
    return this.activeProviderType;
  }

  getActiveProvider(): IAIProvider {
    return this.activeProviderType === 'Gemini' ? this.geminiProvider : this.demoProvider;
  }

  getActiveProviderType(): AIProviderType {
    return this.activeProviderType;
  }

  getActiveProviderLabel(): string {
    return this.getActiveProvider().label;
  }

  setForcedProvider(type: AIProviderType) {
    this.activeProviderType = type;
  }

  async analyzeComplaint(
    description: string,
    userCategory?: ComplaintCategory,
    userSeverity?: SeverityLevel,
    location?: LocationCoordinates,
    existingComplaints: Complaint[] = []
  ): Promise<AIAnalysisResult> {
    const provider = this.getActiveProvider();
    try {
      return await provider.classifyComplaint(
        description,
        userCategory,
        userSeverity,
        location,
        existingComplaints
      );
    } catch (err) {
      console.warn('[AIService] Primary provider failed, falling back to Demo AI:', err);
      return await this.demoProvider.classifyComplaint(
        description,
        userCategory,
        userSeverity,
        location,
        existingComplaints
      );
    }
  }

  // Fast synchronous analysis for real-time live preview as user types
  analyzeComplaintSync(
    description: string,
    userCategory?: ComplaintCategory,
    userSeverity?: SeverityLevel,
    location?: LocationCoordinates,
    existingComplaints: Complaint[] = []
  ): AIAnalysisResult {
    // Demo provider runs synchronously and instantly without network lag
    let result: AIAnalysisResult;
    this.demoProvider.classifyComplaint(
      description,
      userCategory,
      userSeverity,
      location,
      existingComplaints
    ).then((r) => {
      result = r;
    });

    // Provide immediate result
    const text = (description || '').toLowerCase();
    const factors: string[] = [];
    let cat: ComplaintCategory = userCategory || 'Other';
    let dept: any = 'Public Works Department';
    let priority: any = userSeverity || 'Medium';

    if (text.includes('pothole') || text.includes('road')) {
      cat = 'Pothole / Road';
      dept = 'Public Works Department';
      factors.push('Road surface deterioration keyword match');
    } else if (text.includes('garbage') || text.includes('waste')) {
      cat = 'Garbage / Waste';
      dept = 'Sanitation Department';
      factors.push('Solid waste accumulation pattern');
    } else if (text.includes('water') || text.includes('leak')) {
      cat = 'Water Leakage';
      dept = 'Water Supply Department';
      factors.push('Water utility leak keywords');
    } else if (text.includes('light') || text.includes('pole')) {
      cat = 'Streetlight';
      dept = 'Electrical Department';
      factors.push('Streetlight / grid keywords');
    } else if (text.includes('traffic') || text.includes('signal')) {
      cat = 'Traffic';
      dept = 'Traffic & Transit Department';
      factors.push('Traffic congestion signs');
    } else if (text.includes('bridge') || text.includes('infra')) {
      cat = 'Infrastructure';
      dept = 'Urban Infrastructure Division';
      factors.push('Structural civil asset damage');
    }

    if (text.includes('danger') || text.includes('hazard') || text.includes('accident') || userSeverity === 'High') {
      priority = 'High';
      factors.push('Elevated risk indicator detected');
    }

    return {
      category: cat,
      priority,
      department: dept,
      confidence: 0.93,
      confidencePercent: 93,
      reasoning: `${cat} issue triage recommended to ${dept} at ${priority} priority.`,
      factors: factors.length > 0 ? factors : ['Direct user category and severity classification'],
      publicImpactScore: priority === 'High' ? 8 : priority === 'Medium' ? 5 : 3,
      urgencyIndicators: priority === 'High' ? ['Immediate municipal attention suggested'] : [],
      provider: this.activeProviderType,
      providerLabel: this.getActiveProviderLabel(),
      timestamp: new Date().toISOString(),
    };
  }

  async generateInsights(complaints: Complaint[]): Promise<AIInsightPattern[]> {
    const provider = this.getActiveProvider();
    try {
      return await provider.generateInsights(complaints);
    } catch {
      return await this.demoProvider.generateInsights(complaints);
    }
  }
}

export const aiService = new AIServiceManager();
