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
    return this.activeProviderType === 'Gemini' ? 'Gemini 3.1 Flash Lite' : 'Demo AI';
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

  // Fast synchronous analysis for real-time live preview as user types.
  // Clearly labeled as Heuristic Preview — not Gemini.
  // Removes dead/unused async code and avoids fake confidence scores.
  analyzeComplaintSync(
    description: string,
    userCategory?: ComplaintCategory,
    userSeverity?: SeverityLevel,
    location?: LocationCoordinates,
    existingComplaints: Complaint[] = []
  ): AIAnalysisResult {
    const heuristicResult = this.demoProvider.classifyComplaintSync(
      description,
      userCategory,
      userSeverity,
      location,
      existingComplaints
    );

    const targetModel = this.activeProviderType === 'Gemini' ? 'Gemini 3.1 Flash Lite' : 'Demo AI';

    return {
      ...heuristicResult,
      isHeuristicPreview: true,
      provider: 'Demo AI',
      providerLabel: 'Heuristic Preview — not Gemini',
      confidence: undefined,
      confidencePercent: undefined,
      reasoning: `Heuristic rule-based preview based on civic keywords and user inputs. Official AI decision-support analysis will be processed using ${targetModel} upon submission.`,
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
