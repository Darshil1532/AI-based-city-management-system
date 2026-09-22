import { Complaint, Hotspot, ComplaintCategory } from '../../types';
import { INITIAL_HOTSPOTS } from '../../data/mockData';

const STORAGE_KEY = 'smartcity_hotspots_v2';

export interface IHotspotService {
  getAll(): Hotspot[];
  getActive(): Hotspot[];
  getById(id: string): Hotspot | undefined;
  detectClusters(complaints: Complaint[]): Hotspot[];
  saveAll(hotspots: Hotspot[]): void;
  reset(): Hotspot[];
}

export class HotspotService implements IHotspotService {
  private hotspots: Hotspot[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.hotspots = JSON.parse(saved);
        return;
      }
    } catch (e) {
      console.warn('[HotspotService] Could not read from localStorage:', e);
    }
    this.hotspots = [...INITIAL_HOTSPOTS];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.hotspots));
    } catch (e) {
      console.warn('[HotspotService] Could not write to localStorage:', e);
    }
  }

  getAll(): Hotspot[] {
    return [...this.hotspots];
  }

  getActive(): Hotspot[] {
    return this.hotspots.filter((h) => h.status === 'active');
  }

  getById(id: string): Hotspot | undefined {
    return this.hotspots.find((h) => h.id === id);
  }

  saveAll(hotspots: Hotspot[]): void {
    this.hotspots = [...hotspots];
    this.persist();
  }

  reset(): Hotspot[] {
    this.hotspots = [...INITIAL_HOTSPOTS];
    this.persist();
    return [...this.hotspots];
  }

  /**
   * DBSCAN-like spatial clustering algorithm:
   * - Finds dense geographic clusters within radiusMeters (default 400m).
   * - Filters out resolved complaints or complaints older than 14 days.
   * - Discovers emergent hotspots and updates existing ones.
   */
  detectClusters(complaints: Complaint[]): Hotspot[] {
    const RADIUS_METERS = 400;
    const MIN_COMPLAINTS = 3;
    const MAX_DAYS = 14;

    const now = Date.now();
    const activeComplaints = complaints.filter((c) => {
      if (c.status === 'resolved') return false;
      const createdTime = new Date(c.createdAt).getTime();
      const ageDays = (now - createdTime) / (1000 * 60 * 60 * 24);
      return ageDays <= MAX_DAYS;
    });

    if (activeComplaints.length < MIN_COMPLAINTS) {
      return this.hotspots;
    }

    // Distance calculation helper (Haversine formula approximation)
    const distanceBetween = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371e3; // meters
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
    };

    // DBSCAN clustering
    const visited = new Set<string>();
    const clusters: Complaint[][] = [];

    for (const p of activeComplaints) {
      if (visited.has(p.id)) continue;
      visited.add(p.id);

      // Find neighbors
      const neighbors: Complaint[] = [p];
      for (const other of activeComplaints) {
        if (other.id === p.id) continue;
        const dist = distanceBetween(
          p.location.latitude,
          p.location.longitude,
          other.location.latitude,
          other.location.longitude
        );
        if (dist <= RADIUS_METERS) {
          neighbors.push(other);
        }
      }

      if (neighbors.length >= MIN_COMPLAINTS) {
        const cluster: Complaint[] = [...neighbors];
        // Expand cluster
        for (let i = 0; i < cluster.length; i++) {
          const current = cluster[i];
          if (!visited.has(current.id)) {
            visited.add(current.id);
            for (const candidate of activeComplaints) {
              const d = distanceBetween(
                current.location.latitude,
                current.location.longitude,
                candidate.location.latitude,
                candidate.location.longitude
              );
              if (d <= RADIUS_METERS && !cluster.some((c) => c.id === candidate.id)) {
                cluster.push(candidate);
              }
            }
          }
        }
        clusters.push(cluster);
      }
    }

    // Merge overlapping clusters
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

    // Map clusters to Hotspot objects
    const detectedHotspots: Hotspot[] = mergedClusters.map((cluster, index) => {
      // Calculate centroid
      const totalLat = cluster.reduce((sum, c) => sum + c.location.latitude, 0);
      const totalLng = cluster.reduce((sum, c) => sum + c.location.longitude, 0);
      const centerLat = Number((totalLat / cluster.length).toFixed(6));
      const centerLng = Number((totalLng / cluster.length).toFixed(6));

      // Category breakdown
      const catCounts: Record<string, number> = {};
      let highSeverityCount = 0;

      cluster.forEach((c) => {
        catCounts[c.category] = (catCounts[c.category] || 0) + 1;
        if (c.severity === 'High' || c.priority === 'High') highSeverityCount++;
      });

      const mainCategories = Object.entries(catCounts)
        .map(([category, count]) => ({
          category: category as ComplaintCategory,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      const dominantCategory = mainCategories[0]?.category || 'Infrastructure';
      const anchorLocation = cluster[0].location;

      // Risk calculation
      let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate';
      if (cluster.length >= 7 || highSeverityCount >= 4) {
        riskLevel = 'Critical';
      } else if (cluster.length >= 5 || highSeverityCount >= 2) {
        riskLevel = 'High';
      } else if (cluster.length >= 3) {
        riskLevel = 'Moderate';
      }

      // Action suggestion
      let suggestedAction = 'Deploy municipal supervisor to verify local systemic pattern.';
      if (dominantCategory === 'Pothole / Road') {
        suggestedAction = 'Public Works road resurfacing crew should deploy for sub-grade inspection and joint milling.';
      } else if (dominantCategory === 'Garbage / Waste') {
        suggestedAction = 'Sanitation Department to dispatch extra capacity skips and adjust scheduled collection rounds.';
      } else if (dominantCategory === 'Water Leakage') {
        suggestedAction = 'Water Supply Department to initiate acoustic leak survey along utility conduit.';
      } else if (dominantCategory === 'Streetlight') {
        suggestedAction = 'Electrical maintenance team to check phase distribution box and timer controllers.';
      }

      return {
        id: `hs-cluster-${index + 1}`,
        name: `${dominantCategory} Cluster • ${anchorLocation.district || 'Municipal Sector'}`,
        locationName: anchorLocation.address || 'Urban Sector Corridor',
        district: anchorLocation.district || 'Smart City District',
        center: {
          latitude: centerLat,
          longitude: centerLng,
        },
        radiusMeters: RADIUS_METERS,
        complaintCount: cluster.length,
        complaintIds: cluster.map((c) => c.id),
        mainCategories,
        timePeriod: `Past ${MAX_DAYS} Days`,
        riskLevel,
        suggestedAction,
        status: 'active',
        lastDetected: new Date().toISOString(),
      };
    });

    // If clusters discovered, combine with initial curated hotspots (avoiding duplicates)
    if (detectedHotspots.length > 0) {
      this.hotspots = detectedHotspots;
      this.persist();
      return detectedHotspots;
    }

    return this.hotspots;
  }
}

export const hotspotService = new HotspotService();
