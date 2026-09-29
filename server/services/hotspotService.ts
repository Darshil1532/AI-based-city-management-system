import { Complaint, Hotspot, ComplaintCategory } from '../../src/types';
import { INITIAL_HOTSPOTS } from '../../src/data/mockData';
import { getAdminFirestore } from '../lib/firebaseAdmin';

function getCategoryAffinity(catA: string, catB: string): number {
  if (catA === catB) return 1.0;
  const normalize = (c: string) => c.toLowerCase();
  const a = normalize(catA);
  const b = normalize(catB);

  if ((a.includes('road') || a.includes('pothole') || a.includes('infra')) &&
      (b.includes('road') || b.includes('pothole') || b.includes('infra'))) {
    return 0.85;
  }
  if ((a.includes('water') || a.includes('drain')) && (b.includes('water') || b.includes('drain'))) {
    return 0.85;
  }
  if ((a.includes('garbage') || a.includes('waste') || a.includes('sanitation')) &&
      (b.includes('garbage') || b.includes('waste') || b.includes('sanitation'))) {
    return 0.85;
  }
  if ((a.includes('traffic') || a.includes('transit') || a.includes('light')) &&
      (b.includes('traffic') || b.includes('transit') || b.includes('light'))) {
    return 0.80;
  }
  return 0.65;
}

function haversineDistanceMeters(
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

export class HotspotService {
  private hotspots: Hotspot[] = [...INITIAL_HOTSPOTS];

  constructor() {
    this.initFromFirestore();
  }

  private async initFromFirestore(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const adminDb = getAdminFirestore();
      if (!adminDb) return;
      const snapshot = await adminDb.collection('hotspots').get();
      if (!snapshot.empty) {
        const loaded: Hotspot[] = [];
        snapshot.forEach((doc: any) => {
          loaded.push(doc.data() as Hotspot);
        });
        if (loaded.length > 0) {
          this.hotspots = loaded;
        }
      }
    } catch (err: any) {
      console.info('[HotspotService] Firestore sync notice:', err?.message || err);
    }
  }

  getAll(): Hotspot[] {
    return [...this.hotspots];
  }

  detectClusters(complaints: Complaint[]): Hotspot[] {
    const EPSILON_METERS = 800;
    const MIN_POINTS = 2;
    const active = complaints.filter((c) => c.status !== 'resolved');
    if (active.length < MIN_POINTS) {
      return this.hotspots;
    }

    const clusters: Complaint[][] = [];
    const visited = new Set<string>();

    for (const p of active) {
      if (visited.has(p.id)) continue;
      visited.add(p.id);

      const neighbors: Complaint[] = [];
      for (const other of active) {
        if (other.id === p.id) continue;
        const dist = haversineDistanceMeters(
          p.location.latitude,
          p.location.longitude,
          other.location.latitude,
          other.location.longitude
        );
        const affinity = getCategoryAffinity(p.category, other.category);
        const effectiveDist = dist / affinity;
        if (effectiveDist <= EPSILON_METERS) {
          neighbors.push(other);
        }
      }

      if (neighbors.length + 1 >= MIN_POINTS) {
        const cluster = [p, ...neighbors];
        neighbors.forEach((n) => visited.add(n.id));
        clusters.push(cluster);
      }
    }

    if (clusters.length === 0) return this.hotspots;

    const detected: Hotspot[] = clusters.map((cluster, idx) => {
      const count = cluster.length;
      const lats = cluster.map((c) => c.location.latitude);
      const lons = cluster.map((c) => c.location.longitude);
      const centerLat = lats.reduce((a, b) => a + b, 0) / count;
      const centerLon = lons.reduce((a, b) => a + b, 0) / count;

      const catCounts: Record<string, number> = {};
      cluster.forEach((c) => {
        catCounts[c.category] = (catCounts[c.category] || 0) + 1;
      });
      const dominantCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]![0] as ComplaintCategory;

      return {
        id: `HOT-${idx + 1}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        name: `${dominantCategory} Cluster near ${cluster[0]?.location.landmark || cluster[0]?.location.district || 'Civic Area'}`,
        locationName: cluster[0]?.location.landmark || cluster[0]?.location.address || 'Urban Sector',
        district: cluster[0]?.location.district,
        center: { latitude: centerLat, longitude: centerLon },
        radiusMeters: 650,
        radius: 650,
        complaintCount: count,
        complaintIds: cluster.map((c) => c.id),
        mainCategories: Object.entries(catCounts).map(([cat, c]) => ({ category: cat as ComplaintCategory, count: c })),
        timePeriod: 'Last 14 Days',
        riskLevel: count >= 5 ? 'Critical' : count >= 3 ? 'High' : 'Moderate',
        severity: count >= 4 ? 'High' : 'Medium',
        suggestedAction: `Deploy coordinated municipal task force for ${dominantCategory} remediation.`,
        status: 'active',
        lastDetected: new Date().toISOString(),
      };
    });

    this.hotspots = detected;
    return this.hotspots;
  }
}

export const hotspotService = new HotspotService();
