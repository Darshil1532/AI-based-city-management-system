import { Complaint, Hotspot, ComplaintCategory } from '../../types';
import { IHotspotRepository } from '../../repositories/types';
import { repositories } from '../../repositories';

export interface IHotspotService {
  getAll(): Hotspot[];
  getActive(): Hotspot[];
  getById(id: string): Hotspot | undefined;
  detectClusters(complaints: Complaint[]): Hotspot[];
  saveAll(hotspots: Hotspot[]): void;
  reset(): Hotspot[];
}

/**
 * Checks category affinity / similarity between two complaint categories.
 * Returns an affinity factor:
 * - 1.0 for identical categories
 * - 0.85 for related municipal domains (e.g. Road + Infrastructure, or Garbage + Sanitation)
 * - 0.65 for cross-category civic density
 */
function getCategoryAffinity(catA: string, catB: string): number {
  if (catA === catB) return 1.0;

  const normalize = (c: string) => c.toLowerCase();
  const a = normalize(catA);
  const b = normalize(catB);

  // Road & Infrastructure affinity
  if ((a.includes('road') || a.includes('pothole') || a.includes('infra')) &&
      (b.includes('road') || b.includes('pothole') || b.includes('infra'))) {
    return 0.85;
  }

  // Water & Drainage affinity
  if ((a.includes('water') || a.includes('drain')) && (b.includes('water') || b.includes('drain'))) {
    return 0.85;
  }

  // Waste & Sanitation affinity
  if ((a.includes('garbage') || a.includes('waste') || a.includes('sanitation')) &&
      (b.includes('garbage') || b.includes('waste') || b.includes('sanitation'))) {
    return 0.85;
  }

  // Traffic & Transit affinity
  if ((a.includes('traffic') || a.includes('transit') || a.includes('light')) &&
      (b.includes('traffic') || b.includes('transit') || b.includes('light'))) {
    return 0.80;
  }

  return 0.65;
}

/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in meters.
 */
function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export class HotspotService implements IHotspotService {
  private repository: IHotspotRepository;
  private hotspots: Hotspot[] = [];

  constructor(repository?: IHotspotRepository) {
    this.repository = repository || repositories.hotspots;
    this.hotspots = this.repository.getAll();
  }

  private refreshFromRepository(): void {
    this.hotspots = this.repository.getAll();
  }

  getAll(): Hotspot[] {
    this.refreshFromRepository();
    return [...this.hotspots];
  }

  getActive(): Hotspot[] {
    this.refreshFromRepository();
    return this.hotspots.filter((h) => h.status === 'active');
  }

  getById(id: string): Hotspot | undefined {
    return this.repository.getById(id);
  }

  saveAll(hotspots: Hotspot[]): void {
    this.repository.saveAll(hotspots);
    this.refreshFromRepository();
  }

  reset(): Hotspot[] {
    const list = this.repository.reset();
    this.hotspots = [...list];
    return list;
  }

  /**
   * Dynamic Hotspot Clustering Engine:
   * 
   * Prototype Rules:
   * - radius = 400 meters
   * - minimum related complaints = 4
   * - time window = 7 days
   * - uses: latitude, longitude, category, createdAt, severity, priority, status
   * - ignores resolved complaints when calculating active risk
   * - prefers same or similar categories using spatial-semantic affinity
   * - generates Potential Hotspots with confidence and disclaimer:
   *   "Potential hotspot detected from repeated reports."
   */
  detectClusters(complaints: Complaint[]): Hotspot[] {
    const BASE_RADIUS_METERS = 400;
    const MIN_COMPLAINTS = 4;
    const TIME_WINDOW_DAYS = 7;

    const now = Date.now();

    // 1. Filter complaints:
    // - Must have valid coordinates
    // - MUST ignore resolved complaints when calculating active risk
    // - Must fall within the 7-day time window
    const activeCandidates = complaints.filter((c) => {
      if (c.status === 'resolved') return false;
      if (!c.location?.latitude || !c.location?.longitude) return false;

      const createdTime = new Date(c.createdAt).getTime();
      const ageDays = (now - createdTime) / (1000 * 60 * 60 * 24);
      return ageDays <= TIME_WINDOW_DAYS;
    });

    // 2. Dynamic DBSCAN-style clustering preferring same/similar category
    const visited = new Set<string>();
    const clusters: Complaint[][] = [];

    // Helper to evaluate if two complaints should be clustered together
    const areComplaintsRelated = (a: Complaint, b: Complaint): boolean => {
      if (!a.location?.latitude || !a.location?.longitude || !b.location?.latitude || !b.location?.longitude) {
        return false;
      }

      const dist = haversineDistanceMeters(
        a.location.latitude,
        a.location.longitude,
        b.location.latitude,
        b.location.longitude
      );

      const affinity = getCategoryAffinity(a.category, b.category);
      // If exact same category: full 400m radius
      // If similar domain: ~340m radius
      // If cross-category: ~260m radius (dense cluster)
      const allowedDistance = BASE_RADIUS_METERS * affinity;

      return dist <= allowedDistance;
    };

    for (const point of activeCandidates) {
      if (visited.has(point.id)) continue;
      visited.add(point.id);

      // Find initial neighbors based on geographic distance and category affinity
      const neighbors: Complaint[] = [point];
      for (const other of activeCandidates) {
        if (other.id === point.id) continue;
        if (areComplaintsRelated(point, other)) {
          neighbors.push(other);
        }
      }

      // If density threshold met, expand the cluster
      if (neighbors.length >= MIN_COMPLAINTS) {
        const cluster: Complaint[] = [...neighbors];

        for (let i = 0; i < cluster.length; i++) {
          const current = cluster[i];
          if (!visited.has(current.id)) {
            visited.add(current.id);

            for (const candidate of activeCandidates) {
              if (areComplaintsRelated(current, candidate)) {
                if (!cluster.some((c) => c.id === candidate.id)) {
                  cluster.push(candidate);
                }
              }
            }
          }
        }

        clusters.push(cluster);
      }
    }

    // 3. Merge overlapping clusters
    const mergedClusters: Complaint[][] = [];
    for (const cluster of clusters) {
      let merged = false;
      for (const existing of mergedClusters) {
        const hasOverlap = cluster.some((c) => existing.some((e) => e.id === c.id));
        if (hasOverlap) {
          for (const c of cluster) {
            if (!existing.some((e) => e.id === c.id)) {
              existing.push(c);
            }
          }
          merged = true;
          break;
        }
      }
      if (!merged) {
        mergedClusters.push(cluster);
      }
    }

    // 4. Generate Potential Hotspots
    const detectedHotspots: Hotspot[] = mergedClusters.map((cluster, index) => {
      // Centroid
      const totalLat = cluster.reduce((sum, c) => sum + (c.location?.latitude ?? 23.2332), 0);
      const totalLng = cluster.reduce((sum, c) => sum + (c.location?.longitude ?? 77.4338), 0);
      const centerLat = Number((totalLat / cluster.length).toFixed(6));
      const centerLng = Number((totalLng / cluster.length).toFixed(6));

      // Category breakdown & frequency
      const categoryCounts: Record<string, number> = {};
      let highSeverityCount = 0;
      let highPriorityCount = 0;

      cluster.forEach((c) => {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
        if (c.severity === 'High') highSeverityCount++;
        if (c.priority === 'High') highPriorityCount++;
      });

      const mainCategories = Object.entries(categoryCounts)
        .map(([cat, count]) => ({
          category: cat as ComplaintCategory,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      const distinctCategories = mainCategories.map((mc) => mc.category);
      const dominantCategory = mainCategories[0]?.category || 'Infrastructure';
      const dominantCount = mainCategories[0]?.count || 1;
      const anchor = cluster[0];

      // Risk calculation combining cluster density, severity, and priority
      let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate';
      const criticalSignals = highSeverityCount + highPriorityCount;

      if (cluster.length >= 8 || criticalSignals >= 4) {
        riskLevel = 'Critical';
      } else if (cluster.length >= 5 || criticalSignals >= 2) {
        riskLevel = 'High';
      } else if (cluster.length >= MIN_COMPLAINTS) {
        riskLevel = 'Moderate';
      }

      // Dynamic confidence calculation:
      // Confidence scales with sample size, category concentration, and proximity.
      // Capped at 0.98.
      const sizeFactor = Math.min(0.16, (cluster.length - MIN_COMPLAINTS) * 0.04);
      const homogeneityFactor = (dominantCount / cluster.length) * 0.12;
      const baseConfidence = 0.72;
      const confidence = Number(Math.min(0.98, baseConfidence + sizeFactor + homogeneityFactor).toFixed(2));

      // Action advice explicitly noting clustering disclaimer
      let suggestedAction = 'Potential hotspot detected from repeated reports. Field dispatch recommended to inspect infrastructure conditions.';
      if (dominantCategory === 'Pothole / Road') {
        suggestedAction = 'Potential hotspot detected from repeated reports. Public Works road crew recommended for joint milling and sub-grade inspection.';
      } else if (dominantCategory === 'Garbage / Waste') {
        suggestedAction = 'Potential hotspot detected from repeated reports. Sanitation Department recommended to dispatch secondary collection trucks and inspect bin capacity.';
      } else if (dominantCategory === 'Water Leakage') {
        suggestedAction = 'Potential hotspot detected from repeated reports. Water Supply Department recommended to conduct acoustic leak detection along the utility main.';
      } else if (dominantCategory === 'Streetlight') {
        suggestedAction = 'Potential hotspot detected from repeated reports. Electrical team recommended to inspect feeder line stability and timer controllers.';
      }

      return {
        id: `hs-dyn-${index + 1}`,
        name: `Potential Hotspot • ${dominantCategory} (${cluster.length} reports)`,
        locationName: anchor?.location?.landmark || anchor?.location?.address || 'Urban Sector Corridor',
        district: anchor?.location?.district || 'Smart City District',
        center: {
          latitude: centerLat,
          longitude: centerLng,
        },
        radius: BASE_RADIUS_METERS,
        radiusMeters: BASE_RADIUS_METERS,
        complaintIds: cluster.map((c) => c.id),
        complaintCount: cluster.length,
        categories: distinctCategories,
        mainCategories,
        riskLevel,
        severity: highSeverityCount >= 2 ? 'High' : 'Medium',
        confidence,
        timePeriod: `Past ${TIME_WINDOW_DAYS} Days`,
        status: 'active',
        detectionNote: 'Potential hotspot detected from repeated reports.',
        suggestedAction,
        lastDetected: new Date().toISOString(),
      };
    });

    if (detectedHotspots.length > 0) {
      // Merge detected dynamic hotspots with curated hotspots (avoiding duplicates)
      const existing = this.hotspots.filter((h) => !h.id.startsWith('hs-dyn-'));
      const combined = [...detectedHotspots, ...existing];
      this.repository.saveAll(combined);
      this.refreshFromRepository();
      return combined;
    }

    return this.hotspots;
  }
}

export const hotspotService = new HotspotService();
