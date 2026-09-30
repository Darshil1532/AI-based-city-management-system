import {
  ComplaintCategory,
  SeverityLevel,
  PriorityLevel,
  DepartmentName,
  LocationCoordinates,
  Complaint,
} from '../../types';
import { IAIProvider, AIAnalysisResult, AIInsightPattern } from './AIProvider';

export class DemoAIProvider implements IAIProvider {
  name: 'Demo AI' = 'Demo AI';
  label: string = 'Demo AI';

  async isAvailable(): Promise<boolean> {
    return true; // Always available offline and locally
  }

  classifyComplaintSync(
    description: string,
    userCategory?: ComplaintCategory,
    userSeverity?: SeverityLevel,
    location?: LocationCoordinates,
    existingComplaints: Complaint[] = []
  ): AIAnalysisResult {
    const text = (description || '').toLowerCase();
    const factors: string[] = [];
    const urgencyIndicators: string[] = [];
    let detectedCategory: ComplaintCategory = userCategory || 'Other';
    let detectedPriority: PriorityLevel = userSeverity || 'Medium';
    let assignedDepartment: DepartmentName = 'Public Works Department';
    let baseConfidence = 0.88;
    let publicImpactScore = 5;

    // 1. Department & Category Classification Logic
    if (
      text.includes('pothole') ||
      text.includes('road') ||
      text.includes('asphalt') ||
      text.includes('crater') ||
      text.includes('tar') ||
      text.includes('pavement') ||
      text.includes('tarmac') ||
      text.includes('divider')
    ) {
      detectedCategory = 'Pothole / Road';
      assignedDepartment = 'Public Works Department';
      factors.push('Identified road surface deterioration and structural pavement keywords');
      baseConfidence += 0.05;
      publicImpactScore += 2;
    } else if (
      text.includes('garbage') ||
      text.includes('trash') ||
      text.includes('waste') ||
      text.includes('dump') ||
      text.includes('smell') ||
      text.includes('stink') ||
      text.includes('litter') ||
      text.includes('debris') ||
      text.includes('bin') ||
      text.includes('overflow')
    ) {
      detectedCategory = 'Garbage / Waste';
      assignedDepartment = 'Sanitation Department';
      factors.push('Detected solid waste accumulation and hygiene hazard patterns');
      baseConfidence += 0.06;
      publicImpactScore += 1;
    } else if (
      text.includes('water') ||
      text.includes('leak') ||
      text.includes('pipe') ||
      text.includes('sewage') ||
      text.includes('drain') ||
      text.includes('flood') ||
      text.includes('burst') ||
      text.includes('drainage') ||
      text.includes('sewer')
    ) {
      detectedCategory = 'Water Leakage';
      assignedDepartment = 'Water Supply Department';
      factors.push('Detected municipal water distribution / drainage vulnerability keywords');
      baseConfidence += 0.07;
      publicImpactScore += 2;
    } else if (
      text.includes('light') ||
      text.includes('lamp') ||
      text.includes('dark') ||
      text.includes('pole') ||
      text.includes('electric') ||
      text.includes('wire') ||
      text.includes('cable') ||
      text.includes('spark')
    ) {
      detectedCategory = 'Streetlight';
      assignedDepartment = 'Electrical Department';
      factors.push('Detected municipal grid or nighttime illumination failure keywords');
      baseConfidence += 0.05;
      publicImpactScore += 1;
    } else if (
      text.includes('traffic') ||
      text.includes('signal') ||
      text.includes('jam') ||
      text.includes('congestion') ||
      text.includes('intersection') ||
      text.includes('zebra') ||
      text.includes('speed')
    ) {
      detectedCategory = 'Traffic';
      assignedDepartment = 'Traffic & Transit Department';
      factors.push('Identified transit corridor impediment and vehicular bottleneck signs');
      baseConfidence += 0.05;
      publicImpactScore += 2;
    } else if (
      text.includes('bridge') ||
      text.includes('wall') ||
      text.includes('footpath') ||
      text.includes('sidewalk') ||
      text.includes('manhole') ||
      text.includes('collapse')
    ) {
      detectedCategory = 'Infrastructure';
      assignedDepartment = 'Urban Infrastructure Division';
      factors.push('Structural civil asset damage detected');
      baseConfidence += 0.04;
      publicImpactScore += 3;
    } else if (userCategory) {
      detectedCategory = userCategory;
      if (userCategory === 'Pothole / Road') assignedDepartment = 'Public Works Department';
      else if (userCategory === 'Garbage / Waste') assignedDepartment = 'Sanitation Department';
      else if (userCategory === 'Water Leakage') assignedDepartment = 'Water Supply Department';
      else if (userCategory === 'Streetlight') assignedDepartment = 'Electrical Department';
      else if (userCategory === 'Traffic') assignedDepartment = 'Traffic & Transit Department';
      else if (userCategory === 'Infrastructure') assignedDepartment = 'Urban Infrastructure Division';
      factors.push(`Retained citizen-submitted category: "${userCategory}"`);
    }

    // 2. High-Risk Urgency Assessment
    const isSevereHazard =
      text.includes('danger') ||
      text.includes('hazard') ||
      text.includes('accident') ||
      text.includes('injury') ||
      text.includes('emergency') ||
      text.includes('sparks') ||
      text.includes('sinkhole') ||
      text.includes('burst') ||
      text.includes('hospital') ||
      text.includes('school');

    if (isSevereHazard) {
      detectedPriority = 'High';
      factors.push('Urgent public safety trigger detected in complaint description');
      urgencyIndicators.push('Critical safety threat detected');
      publicImpactScore = Math.min(10, publicImpactScore + 3);
      baseConfidence = Math.min(0.98, baseConfidence + 0.04);
    } else if (userSeverity === 'High') {
      detectedPriority = 'High';
      factors.push('User reported High severity level');
      publicImpactScore = Math.min(10, publicImpactScore + 1);
    } else if (userSeverity === 'Low' && !isSevereHazard) {
      detectedPriority = 'Low';
    } else {
      detectedPriority = 'Medium';
    }

    // 3. Geographic Context & Spatial Proximity
    if (location) {
      const locText = `${location.address || ''} ${location.landmark || ''} ${location.district || ''}`.toLowerCase();
      if (locText.includes('market') || locText.includes('commercial') || locText.includes('bus stand') || locText.includes('isbt') || locText.includes('station')) {
        factors.push('High-density pedestrian/transit zone increases civic response urgency');
        publicImpactScore = Math.min(10, publicImpactScore + 2);
      }
      if (locText.includes('hospital') || locText.includes('school')) {
        factors.push('Designated sensitive municipal safety zone (Hospital/School corridor)');
        detectedPriority = 'High';
        publicImpactScore = Math.min(10, publicImpactScore + 2);
      }
    }

    // 4. Co-located Complaints & Clustering Factor
    if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number' && existingComplaints.length > 0) {
      const nearbyCount = existingComplaints.filter((c) => {
        if (!c.location || typeof c.location.latitude !== 'number' || typeof c.location.longitude !== 'number') return false;
        const dLat = (c.location.latitude - location.latitude) * 111000;
        const dLng = (c.location.longitude - location.longitude) * 111000 * Math.cos((location.latitude * Math.PI) / 180);
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        return dist < 300 && c.status !== 'resolved';
      }).length;

      if (nearbyCount >= 2) {
        factors.push(`Identified ${nearbyCount} active co-located issues within 300m radius`);
        if (detectedPriority === 'Medium') detectedPriority = 'High';
        publicImpactScore = Math.min(10, publicImpactScore + 1);
        baseConfidence = Math.min(0.97, baseConfidence + 0.03);
      }
    }

    // Reasoning narrative
    const reasoning = `${detectedCategory} issue classified with ${detectedPriority} triage priority. Recommended allocation to ${assignedDepartment} based on keyword patterns, ${factors.length} civic contextual factors, and municipal jurisdiction routing rules.`;

    const finalConfidence = Math.min(0.98, Math.max(0.75, Number(baseConfidence.toFixed(2))));

    return {
      category: detectedCategory,
      priority: detectedPriority,
      department: assignedDepartment,
      confidence: finalConfidence,
      confidencePercent: Math.round(finalConfidence * 100),
      reasoning,
      factors,
      publicImpactScore: Math.min(10, Math.max(1, publicImpactScore)),
      urgencyIndicators,
      provider: this.name,
      providerLabel: this.label,
      timestamp: new Date().toISOString(),
    };
  }

  async classifyComplaint(
    description: string,
    userCategory?: ComplaintCategory,
    userSeverity?: SeverityLevel,
    location?: LocationCoordinates,
    existingComplaints: Complaint[] = []
  ): Promise<AIAnalysisResult> {
    return this.classifyComplaintSync(
      description,
      userCategory,
      userSeverity,
      location,
      existingComplaints
    );
  }

  async generateInsights(complaints: Complaint[]): Promise<AIInsightPattern[]> {
    const activeComplaints = complaints.filter((c) => c.status !== 'resolved');
    const insights: AIInsightPattern[] = [];

    // Check road potholes pattern
    const roadIssues = activeComplaints.filter((c) => c.category === 'Pothole / Road');
    if (roadIssues.length >= 2) {
      insights.push({
        title: 'Road Surface Degradation Along Commercial Arteries',
        detectedPattern: `${roadIssues.length} active road surface issues detected. High density near major transit gates indicates subsurface base erosion after recent rain.`,
        recommendation: 'Public Works should inspect sub-base compaction and dispatch hot-mix paving trucks rather than temporary cold-patching.',
        priority: 'High',
        department: 'Public Works Department',
        suggestedDepartment: 'Public Works Department',
        location: roadIssues[0]?.location?.district || roadIssues[0]?.location?.address || 'Main Market Road Corridor',
        relatedComplaintIds: roadIssues.map((c) => c.id).slice(0, 5),
        potentialCauseHypothesis: 'Stormwater pooling combined with heavy transit axle loads causing accelerated sub-grade degradation.',
        estimatedImpact: 'Reduces transit vehicle damage and prevents peak-hour congestion bottlenecks.',
        disclaimer: 'AI-generated hypothesis — requires administrative validation.',
      });
    }

    // Check waste accumulation pattern
    const wasteIssues = activeComplaints.filter((c) => c.category === 'Garbage / Waste');
    if (wasteIssues.length >= 2) {
      insights.push({
        title: 'Market Zone Waste Container Capacity Deficit',
        detectedPattern: `${wasteIssues.length} waste overflow complaints clustered near vendor stalls. Secondary overflow occurs within 12 hours of clearance.`,
        recommendation: 'Deploy an additional 4.5 cubic meter compactor bin and adjust sanitation pickup frequency to twice daily (06:00 and 19:00).',
        priority: 'Medium',
        department: 'Sanitation Department',
        suggestedDepartment: 'Sanitation Department',
        location: wasteIssues[0]?.location?.district || wasteIssues[0]?.location?.address || 'Market Stalls Sector',
        relatedComplaintIds: wasteIssues.map((c) => c.id).slice(0, 5),
        potentialCauseHypothesis: 'Underestimated vendor biowaste volume during weekend trading peaks.',
        estimatedImpact: 'Eliminates public health risks and restores sidewalk accessibility.',
        disclaimer: 'AI-generated hypothesis — requires administrative validation.',
      });
    }

    // Check water pressure leaks
    const waterIssues = activeComplaints.filter((c) => c.category === 'Water Leakage');
    if (waterIssues.length >= 1) {
      insights.push({
        title: 'Subsurface Pipeline Rupture Near Healthcare Perimeter',
        detectedPattern: 'Recurring water pooling without direct precipitation indicates mainline pressurized joint breach.',
        recommendation: 'Perform acoustic leak detection and pressure throttling along the primary distribution feeder line.',
        priority: 'High',
        department: 'Water Supply Department',
        suggestedDepartment: 'Water Supply Department',
        location: waterIssues[0]?.location?.district || waterIssues[0]?.location?.address || 'Hospital Road Utility Corridor',
        relatedComplaintIds: waterIssues.map((c) => c.id).slice(0, 3),
        potentialCauseHypothesis: 'Aging ductile iron pipeline joint seal failure under elevated morning booster pump pressure.',
        estimatedImpact: 'Conserves potable water and prevents pavement structural undermining.',
        disclaimer: 'AI-generated hypothesis — requires administrative validation.',
      });
    }

    return insights;
  }
}
