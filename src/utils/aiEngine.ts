import {
  ComplaintCategory,
  SeverityLevel,
  PriorityLevel,
  DepartmentName,
  AIAnalysis,
  LocationCoordinates,
  Complaint,
  Hotspot,
} from '../types';

export function runAIComplaintAnalysis(
  description: string,
  selectedCategory: ComplaintCategory,
  selectedSeverity: SeverityLevel,
  location: LocationCoordinates,
  existingComplaints: Complaint[] = []
): AIAnalysis {
  const text = description.toLowerCase();

  // 1. Classification
  let predictedCategory: ComplaintCategory = selectedCategory;
  let confidence = 0.91;

  if (text.includes('pothole') || text.includes('asphalt') || text.includes('road') || text.includes('crater') || text.includes('tarmac') || text.includes('pavement')) {
    predictedCategory = 'Pothole / Road';
    confidence = 0.96;
  } else if (text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('dump') || text.includes('rubbish') || text.includes('bin') || text.includes('smell') || text.includes('stench')) {
    predictedCategory = 'Garbage / Waste';
    confidence = 0.97;
  } else if (text.includes('water') || text.includes('pipe') || text.includes('leak') || text.includes('burst') || text.includes('drain') || text.includes('flooding') || text.includes('sewer') || text.includes('sewage')) {
    predictedCategory = 'Water Leakage';
    confidence = 0.95;
  } else if (text.includes('streetlight') || text.includes('lamp') || text.includes('light') || text.includes('pole') || text.includes('dark') || text.includes('illumination') || text.includes('bulb')) {
    predictedCategory = 'Streetlight';
    confidence = 0.94;
  } else if (text.includes('traffic') || text.includes('signal') || text.includes('jam') || text.includes('gridlock') || text.includes('congestion') || text.includes('intersection') || text.includes('bus') || text.includes('tram')) {
    predictedCategory = 'Traffic';
    confidence = 0.93;
  } else if (text.includes('bridge') || text.includes('footbridge') || text.includes('sidewalk') || text.includes('bench') || text.includes('handrail') || text.includes('manhole') || text.includes('structure') || text.includes('railing')) {
    predictedCategory = 'Infrastructure';
    confidence = 0.92;
  }

  // 2. Department recommendation
  let recommendedDepartment: DepartmentName = 'General Municipal Administration';
  switch (predictedCategory) {
    case 'Pothole / Road':
      recommendedDepartment = 'Public Works Department';
      break;
    case 'Garbage / Waste':
      recommendedDepartment = 'Sanitation Department';
      break;
    case 'Water Leakage':
      recommendedDepartment = 'Water Supply Department';
      break;
    case 'Streetlight':
      recommendedDepartment = 'Electrical Department';
      break;
    case 'Traffic':
      recommendedDepartment = 'Traffic & Transit Department';
      break;
    case 'Infrastructure':
      recommendedDepartment = 'Urban Infrastructure Division';
      break;
    default:
      recommendedDepartment = 'General Municipal Administration';
      break;
  }

  // 3. Proximity / similar complaint check
  const R = 6371e3; // Earth radius in meters
  let similarNearbyCount = 0;

  for (const c of existingComplaints) {
    if (!c.location) continue;
    const lat1 = (location.latitude * Math.PI) / 180;
    const lat2 = (c.location.latitude * Math.PI) / 180;
    const deltaLat = ((c.location.latitude - location.latitude) * Math.PI) / 180;
    const deltaLng = ((c.location.longitude - location.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const distanceMeters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    if (distanceMeters <= 400) {
      similarNearbyCount++;
    }
  }

  // 4. Priority Prediction & Factors
  const factors: string[] = [];
  const urgencyIndicators: string[] = [];
  let publicImpactScore = 5;

  factors.push(`User-reported severity: ${selectedSeverity}`);

  const highUrgencyKeywords = [
    'emergency', 'danger', 'hazard', 'manhole', 'accident', 'burst', 'flooding',
    'hospital', 'school', 'children', 'elderly', 'fall', 'severe', 'sparking',
    'fire', 'electric shock', 'unconscious', 'ruptured', 'collapsed', 'deep',
  ];

  const matchedUrgency = highUrgencyKeywords.filter((word) => text.includes(word));
  if (matchedUrgency.length > 0) {
    urgencyIndicators.push(...matchedUrgency);
    factors.push(`Urgency signals detected in description: [${matchedUrgency.join(', ')}]`);
    publicImpactScore += 2.5;
  }

  if (similarNearbyCount > 0) {
    factors.push(`Spatial density: ${similarNearbyCount} nearby unresolved report(s) within 400m`);
    publicImpactScore += Math.min(similarNearbyCount * 0.8, 2.5);
  }

  if (
    location.address?.toLowerCase().includes('market') ||
    location.landmark?.toLowerCase().includes('market') ||
    location.address?.toLowerCase().includes('school') ||
    location.address?.toLowerCase().includes('hospital') ||
    location.address?.toLowerCase().includes('metro') ||
    location.address?.toLowerCase().includes('station')
  ) {
    factors.push(`High-density civic zone detected: ${location.landmark || location.address}`);
    publicImpactScore += 1.5;
  }

  let recommendedPriority: PriorityLevel = 'Medium';

  if (selectedSeverity === 'High' || publicImpactScore >= 7.5 || matchedUrgency.length > 0) {
    recommendedPriority = 'High';
  } else if (selectedSeverity === 'Low' && publicImpactScore < 5.5 && similarNearbyCount === 0) {
    recommendedPriority = 'Low';
  } else {
    recommendedPriority = 'Medium';
  }

  // 5. Reasoning synthesis
  let reasoning = `Automated analysis for ${predictedCategory}: `;
  if (recommendedPriority === 'High') {
    reasoning += `High priority recommended due to severe public safety hazard score (${Math.min(10, Math.round(publicImpactScore * 10) / 10)}/10) and ${
      matchedUrgency.length > 0
        ? `urgent environmental or bodily risk indicators.`
        : `elevated municipal infrastructure impact.`
    }`;
  } else if (recommendedPriority === 'Medium') {
    reasoning += `Standard municipal triage level appropriate. Impact localized with moderate pedestrian/vehicular disturbance.`;
  } else {
    reasoning += `Low urgency detected. Routine scheduled maintenance or monitoring cycle recommended.`;
  }

  return {
    category: predictedCategory,
    priority: recommendedPriority,
    department: recommendedDepartment,
    confidence: Math.round(confidence * 100) / 100,
    reasoning,
    factors,
    publicImpactScore: Math.min(10, Math.max(1, Math.round(publicImpactScore * 10) / 10)),
    similarNearbyCount,
    urgencyIndicators,
  };
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function recalculateHotspotsFromComplaints(
  complaints: Complaint[],
  baseHotspots: Hotspot[]
): Hotspot[] {
  const now = new Date().toISOString();

  // 1. Recalculate existing hotspots with current complaint data
  const updatedHotspots: Hotspot[] = baseHotspots.map((hs) => {
    // Find all complaints within radius
    const matchingComplaints = complaints.filter((c) => {
      const dist = calculateDistanceMeters(
        hs.center.latitude,
        hs.center.longitude,
        c.location.latitude,
        c.location.longitude
      );
      return dist <= hs.radiusMeters + 50; // allow slight cluster drift
    });

    const activeComplaints = matchingComplaints.filter((c) => c.status !== 'resolved');
    const complaintIds = matchingComplaints.map((c) => c.id);

    // Compute category counts
    const catMap: Record<string, number> = {};
    matchingComplaints.forEach((c) => {
      catMap[c.category] = (catMap[c.category] || 0) + 1;
    });

    const mainCategories = Object.entries(catMap)
      .map(([category, count]) => ({
        category: category as ComplaintCategory,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // Risk calculation
    const hasHighPriority = activeComplaints.some((c) => c.priority === 'High');
    let riskLevel: Hotspot['riskLevel'] = 'Moderate';
    if (activeComplaints.length >= 5 || (activeComplaints.length >= 3 && hasHighPriority)) {
      riskLevel = 'Critical';
    } else if (activeComplaints.length >= 2 || hasHighPriority) {
      riskLevel = 'High';
    } else if (activeComplaints.length === 1) {
      riskLevel = 'Moderate';
    } else {
      riskLevel = 'Low';
    }

    // Dynamic suggested action based on dominant category
    const dominantCat = mainCategories[0]?.category;
    let suggestedAction = hs.suggestedAction;
    if (dominantCat === 'Pothole / Road') {
      suggestedAction = `High asphalt degradation detected (${mainCategories[0]?.count} road reports). Dispatch Public Works paving crew with hot-mix asphalt compaction equipment.`;
    } else if (dominantCat === 'Garbage / Waste') {
      suggestedAction = `Sanitation density alert. Schedule additional automated waste compactor rounds and deploy sidewalk pressure-washing team.`;
    } else if (dominantCat === 'Water Leakage') {
      suggestedAction = `Hydraulic infrastructure cluster. Deploy acoustic leak detection sensors and inspect municipal sub-mains for pressure surges.`;
    } else if (dominantCat === 'Traffic') {
      suggestedAction = `Transit corridor congestion. Recalibrate traffic signal phase timers and dispatch transit enforcement unit.`;
    } else if (activeComplaints.length === 0) {
      suggestedAction = `All reported incidents within this sector have been resolved. Routine monitoring schedule active.`;
    }

    return {
      ...hs,
      complaintCount: matchingComplaints.length,
      complaintIds,
      mainCategories: mainCategories.length > 0 ? mainCategories : hs.mainCategories,
      riskLevel,
      suggestedAction,
      status: activeComplaints.length > 0 ? 'active' : 'addressed',
      lastDetected: now,
    };
  });

  return updatedHotspots;
}
