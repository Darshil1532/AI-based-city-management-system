import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { Complaint, Hotspot, ComplaintCategory } from '../../types';
import { CITY_BOUNDS, POPULAR_LANDMARKS } from '../../data/mockData';
import { GoogleMapCanvas } from './GoogleMapCanvas';
import { escapeHtml, safeText } from '../../utils/domSafe';
import {
  MapPin,
  Flame,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Crosshair,
  Layers,
  Search,
  Check,
  Clock,
  AlertTriangle,
  Compass,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

// Fix for default Leaflet icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SmartCityMapProps {
  complaints?: Complaint[];
  hotspots?: Hotspot[];
  selectedComplaintId?: string;
  selectedHotspotId?: string;
  onSelectComplaint?: (complaint: Complaint) => void;
  onSelectHotspot?: (hotspot: Hotspot) => void;
  selectable?: boolean;
  selectedLocation?: { latitude: number; longitude: number; address?: string };
  onLocationSelect?: (loc: { latitude: number; longitude: number; address: string; landmark?: string }) => void;
  height?: string;
  showHotspotsByDefault?: boolean;
  showFilterControls?: boolean;
  singleMarker?: { latitude: number; longitude: number; title?: string; category?: ComplaintCategory };
}

// Tile layers configurations - using OpenStreetMap, Esri Satellite, and genuine CartoDB Dark Matter
const TILE_PROVIDERS = {
  streets: {
    name: 'Streets',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: '',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
    subdomains: '',
  },
  dark: {
    name: 'Night Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
  },
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; pinBg: string }> = {
  'Pothole / Road': { bg: '#fff7ed', border: '#f97316', text: '#c2410c', pinBg: '#ea580c' },
  'Garbage / Waste': { bg: '#ecfdf5', border: '#10b981', text: '#047857', pinBg: '#059669' },
  'Water Leakage': { bg: '#f0f9ff', border: '#0284c7', text: '#0369a1', pinBg: '#0284c7' },
  'Streetlight': { bg: '#fefce8', border: '#eab308', text: '#a16207', pinBg: '#ca8a04' },
  'Traffic': { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', pinBg: '#dc2626' },
  'Infrastructure': { bg: '#faf5ff', border: '#a855f7', text: '#7e22ce', pinBg: '#9333ea' },
};

export const SmartCityMap: React.FC<SmartCityMapProps> = ({
  complaints = [],
  hotspots = [],
  selectedComplaintId,
  selectedHotspotId,
  onSelectComplaint,
  onSelectHotspot,
  selectable = false,
  selectedLocation,
  onLocationSelect,
  height = 'h-[500px]',
  showHotspotsByDefault = true,
  showFilterControls = true,
  singleMarker,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarksLayerRef = useRef<L.LayerGroup | null>(null);
  const selectionMarkerRef = useRef<L.Marker | null>(null);

  const [activeTheme, setActiveTheme] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [showHotspots, setShowHotspots] = useState(showHotspotsByDefault);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(selectable);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  // Google Maps API integration with honest Fallback GIS detection
  const googleMapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const [useGoogleMaps, setUseGoogleMaps] = useState<boolean>(!!googleMapsApiKey);
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);

  // Center coordinates: from selectedLocation, singleMarker, or CITY_BOUNDS center
  const initialCenter = useMemo<[number, number]>(() => {
    if (singleMarker) return [singleMarker.latitude, singleMarker.longitude];
    if (selectedLocation) return [selectedLocation.latitude, selectedLocation.longitude];
    return [CITY_BOUNDS.center.lat, CITY_BOUNDS.center.lng];
  }, [singleMarker, selectedLocation]);

  // Filtered complaints based on layer visibility and user filters
  const filteredComplaints = useMemo(() => {
    if (!showIncidents) return [];
    return complaints.filter((c) => {
      const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
      const matchesPri = priorityFilter === 'all' || c.priority === priorityFilter;
      return matchesCat && matchesPri;
    });
  }, [complaints, showIncidents, categoryFilter, priorityFilter]);

  // Reverse geocoding helper (OSM Nominatim with graceful fallback)
  const resolveAddressFromCoords = async (lat: number, lng: number) => {
    setReverseGeocoding(true);
    let resolvedAddress = '';
    let resolvedLandmark = '';

    try {
      // Fast fetch with 2.5s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          resolvedAddress = parts.slice(0, 3).join(',').trim();
          resolvedLandmark = data.address?.amenity || data.address?.building || data.address?.road || 'City Sector';
        }
      }
    } catch {
      // Ignore network timeout/failure and proceed to fallback
    }

    // Fallback if reverse geocode didn't return or failed
    if (!resolvedAddress) {
      // Find nearest known landmark
      let nearest = POPULAR_LANDMARKS[0];
      let minDistance = 999999;
      for (const lm of POPULAR_LANDMARKS) {
        const d = Math.hypot(lm.lat - lat, lm.lng - lng);
        if (d < minDistance) {
          minDistance = d;
          nearest = lm;
        }
      }

      if (minDistance < 0.005) {
        resolvedAddress = `${nearest.address} (Near ${nearest.name})`;
        resolvedLandmark = nearest.name;
      } else {
        const latRef = lat.toFixed(4);
        const lngRef = lng.toFixed(4);
        resolvedAddress = `Municipal Grid Sector (${latRef}° N, ${lngRef}° W)`;
        resolvedLandmark = 'City Sector Zone';
      }
    }

    setReverseGeocoding(false);
    return { address: resolvedAddress, landmark: resolvedLandmark };
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: singleMarker ? 16 : 14,
      zoomControl: false,
      attributionControl: false,
      minZoom: 10,
      maxZoom: 19,
    });

    // Add CartoDB Voyager tiles
    const tileConfig = TILE_PROVIDERS[activeTheme];
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
      subdomains: tileConfig.subdomains,
    }).addTo(map);

    // Create Layer Groups
    const markersLayer = L.layerGroup().addTo(map);
    const hotspotsLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersLayerRef.current = markersLayer;
    hotspotsLayerRef.current = hotspotsLayer;

    // Track zoom
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Handle map click for location picking
    if (selectable && onLocationSelect) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        updateSelectionMarker(lat, lng, true);
      });
    }

    // Invalidate size on resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer on theme change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfig = TILE_PROVIDERS[activeTheme];
    const newTileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
      subdomains: tileConfig.subdomains || '',
    }).addTo(map);

    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [activeTheme]);

  // Update selection marker for location picker mode
  const updateSelectionMarker = useCallback(
    async (lat: number, lng: number, triggerReverseGeocode = false) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (!selectionMarkerRef.current) {
        // Create selection pin icon
        const selectionIcon = L.divIcon({
          className: 'custom-selection-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; border: 2.5px solid #ffffff; box-shadow: 0 0 0 2px #0f172a;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div style="width: 2px; height: 10px; background: #0f172a;"></div>
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #0f172a; opacity: 0.6;"></div>
            </div>
          `,
          iconSize: [36, 54],
          iconAnchor: [18, 54],
          popupAnchor: [0, -48],
        });

        const marker = L.marker([lat, lng], {
          icon: selectionIcon,
          draggable: true,
          zIndexOffset: 1000,
        }).addTo(map);

        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          const { address, landmark } = await resolveAddressFromCoords(pos.lat, pos.lng);
          onLocationSelect?.({
            latitude: Number(pos.lat.toFixed(6)),
            longitude: Number(pos.lng.toFixed(6)),
            address,
            landmark,
          });
          marker.bindPopup(createSelectionPopupHtml(address, pos.lat, pos.lng)).openPopup();
        });

        selectionMarkerRef.current = marker;
      } else {
        selectionMarkerRef.current.setLatLng([lat, lng]);
      }

      if (triggerReverseGeocode && onLocationSelect) {
        const { address, landmark } = await resolveAddressFromCoords(lat, lng);
        onLocationSelect({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          address,
          landmark,
        });
        selectionMarkerRef.current.bindPopup(createSelectionPopupHtml(address, lat, lng)).openPopup();
      }
    },
    [onLocationSelect]
  );

  const createSelectionPopupHtml = (address: string, lat: number, lng: number) => {
    return `
      <div style="padding: 12px; font-family: 'Plus Jakarta Sans', sans-serif; min-width: 200px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; font-family: monospace;">Selected Location</span>
        </div>
        <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">${address}</div>
        <div style="font-size: 10px; font-family: monospace; color: #64748b;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
      </div>
    `;
  };

  // Sync selection marker if selectedLocation prop changes from outside (e.g. GPS or landmark click)
  useEffect(() => {
    if (!selectable || !selectedLocation) return;
    updateSelectionMarker(selectedLocation.latitude, selectedLocation.longitude, false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedLocation.latitude, selectedLocation.longitude], 16, {
        duration: 0.8,
      });
    }
  }, [selectedLocation?.latitude, selectedLocation?.longitude, selectable, updateSelectionMarker]);

  // Render Single Marker Mode (for Detail page)
  useEffect(() => {
    if (!singleMarker || !mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    const colors = CATEGORY_COLORS[singleMarker.category || 'Pothole / Road'] || CATEGORY_COLORS['Pothole / Road'];

    const singleIcon = L.divIcon({
      className: 'custom-single-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: ${colors.pinBg}; color: white; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style="width: 3px; height: 10px; background: ${colors.pinBg};"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${colors.pinBg}; opacity: 0.6;"></div>
        </div>
      `,
      iconSize: [40, 58],
      iconAnchor: [20, 58],
      popupAnchor: [0, -50],
    });

    const marker = L.marker([singleMarker.latitude, singleMarker.longitude], {
      icon: singleIcon,
    }).addTo(layer);

    if (singleMarker.title) {
      marker
        .bindPopup(
          `
        <div style="padding: 12px; font-family: 'Plus Jakarta Sans', sans-serif; min-width: 220px;">
          <span style="font-size: 10px; font-weight: 700; color: ${colors.text}; background: ${colors.bg}; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${singleMarker.category || 'Incident'}</span>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 6px;">${singleMarker.title}</div>
        </div>
      `
        )
        .openPopup();
    }

    mapInstanceRef.current.flyTo([singleMarker.latitude, singleMarker.longitude], 16, { duration: 0.8 });
  }, [singleMarker]);

  // Render Complaints Markers
  useEffect(() => {
    if (singleMarker) return;
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    if (!showIncidents) return;

    filteredComplaints.forEach((complaint) => {
      if (!complaint.location?.latitude || !complaint.location?.longitude) return;
      const colors = CATEGORY_COLORS[complaint.category] || CATEGORY_COLORS['Pothole / Road'];
      const isUrgent = complaint.priority === 'High' && complaint.status !== 'resolved';
      const isSelected = selectedComplaintId === complaint.id;

      // Custom div icon with dynamic styling
      const markerIcon = L.divIcon({
        className: 'custom-complaint-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;" class="${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            ${
              isUrgent
                ? `<div style="position: absolute; top: -4px; left: -4px; width: 36px; height: 36px; border-radius: 50%; background: ${colors.pinBg}; opacity: 0.4;" class="animate-marker-pulse"></div>`
                : ''
            }
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${
              isSelected ? '#0f172a' : colors.pinBg
            }; color: white; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
              <span style="font-size: 10px; font-weight: 800; font-family: monospace;">${complaint.id.replace('SC', '')}</span>
            </div>
            <div style="width: 2px; height: 6px; background: ${isSelected ? '#0f172a' : colors.pinBg};"></div>
          </div>
        `,
        iconSize: [28, 40],
        iconAnchor: [14, 38],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([complaint.location.latitude, complaint.location.longitude], {
        icon: markerIcon,
      }).addTo(layer);

      // Construct rich popup
      const statusColor =
        complaint.status === 'resolved'
          ? 'background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;'
          : complaint.status === 'in_progress'
          ? 'background: #fffbeb; color: #b45309; border: 1px solid #fde68a;'
          : complaint.status === 'assigned'
          ? 'background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;'
          : 'background: #f8fafc; color: #334155; border: 1px solid #cbd5e1;';

      const priorityColor =
        complaint.priority === 'High'
          ? 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'
          : complaint.priority === 'Medium'
          ? 'background: #fffbeb; color: #b45309; border: 1px solid #fde68a;'
          : 'background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;';

      const popupContent = document.createElement('div');
      popupContent.style.cssText = 'padding: 14px; font-family: "Plus Jakarta Sans", sans-serif; width: 260px;';
      popupContent.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #0f172a; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${
            complaint.id
          }</span>
          <div style="display: flex; gap: 4px;">
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 1px 6px; border-radius: 9999px; ${priorityColor}">${
        complaint.priority
      }</span>
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 1px 6px; border-radius: 9999px; ${statusColor}">${complaint.status.replace(
        '_',
        ' '
      )}</span>
          </div>
        </div>

        ${
          complaint.image
            ? `<div style="width: 100%; height: 90px; border-radius: 6px; overflow: hidden; margin-bottom: 8px; background: #e2e8f0;">
                <img src="${complaint.image}" alt="Evidence" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>`
            : ''
        }

        <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 6px;">${
          escapeHtml(complaint.title)
        }</div>
        
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 4px;">
          <span>📍</span>
          <span>${escapeHtml(complaint.location?.address || complaint.location?.district || 'Municipal Sector')}</span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid #f1f5f9; margin-top: 6px;">
          <span style="font-size: 10px; color: #64748b;">Dept: <strong style="color: #0f172a;">${
            (complaint.assignedDepartment || complaint.department || 'Unassigned').split(' ')[0]
          }</strong></span>
          <button id="btn-view-${complaint.id}" style="font-size: 11px; font-weight: 700; color: #ffffff; background: #0f172a; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span>Details</span>
            <span>&rarr;</span>
          </button>
        </div>
      `;

      // Attach button click event
      const viewBtn = popupContent.querySelector(`#btn-view-${complaint.id}`);
      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectComplaint?.(complaint);
        });
      }

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectComplaint?.(complaint);
      });

      // Auto-open popup if selected
      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
          mapInstanceRef.current?.flyTo([complaint.location.latitude, complaint.location.longitude], 16, {
            duration: 0.8,
          });
        }, 100);
      }
    });
  }, [complaints, categoryFilter, priorityFilter, showIncidents, selectedComplaintId, singleMarker, onSelectComplaint]);

  // Render Civic Landmarks Layer
  useEffect(() => {
    if (singleMarker) return;
    if (!mapInstanceRef.current) return;

    if (!landmarksLayerRef.current) {
      landmarksLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }
    const layer = landmarksLayerRef.current;
    layer.clearLayers();

    if (!showLandmarks) return;

    POPULAR_LANDMARKS.forEach((lm) => {
      const landmarkIcon = L.divIcon({
        className: 'custom-landmark-marker',
        html: `
          <div style="background: #0f172a; color: white; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 700; border: 1.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 3px; white-space: nowrap; cursor: pointer;">
            <span>🏛️</span>
            <span>${lm.name}</span>
          </div>
        `,
        iconSize: [110, 24],
        iconAnchor: [55, 12],
      });

      const marker = L.marker([lm.lat, lm.lng], { icon: landmarkIcon }).addTo(layer);
      marker.bindPopup(`
        <div style="padding: 8px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${lm.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${lm.address}</div>
        </div>
      `);
    });
  }, [showLandmarks, singleMarker]);

  // Render Hotspots (Geographic Clusters)
  useEffect(() => {
    if (singleMarker) return;
    if (!mapInstanceRef.current || !hotspotsLayerRef.current) return;

    const layer = hotspotsLayerRef.current;
    layer.clearLayers();

    if (!showHotspots) return;

    hotspots.forEach((hs) => {
      const isCritical = hs.riskLevel === 'Critical';
      const strokeColor = isCritical ? '#e11d48' : '#d97706';
      const fillColor = isCritical ? '#fb7185' : '#fbbf24';

      // Circle representing statistical radius in meters
      const circle = L.circle([hs.center.latitude, hs.center.longitude], {
        radius: hs.radiusMeters,
        color: strokeColor,
        weight: 2,
        dashArray: isCritical ? undefined : '5, 5',
        fillColor: fillColor,
        fillOpacity: isCritical ? 0.22 : 0.16,
      }).addTo(layer);

      // Center cluster badge icon
      const centerIcon = L.divIcon({
        className: 'custom-hotspot-center',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: ${strokeColor}; color: white; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;">
            <div style="position: absolute; top: -6px; left: -6px; right: -6px; bottom: -6px; border-radius: 50%; border: 2px dashed ${strokeColor}; opacity: 0.6;" class="animate-hotspot-pulse"></div>
            <span style="font-size: 11px; font-weight: 800; font-family: monospace;">${hs.complaintCount}</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -20],
      });

      const centerMarker = L.marker([hs.center.latitude, hs.center.longitude], {
        icon: centerIcon,
      }).addTo(layer);

      // Hotspot popup
      const hotspotPopupContent = document.createElement('div');
      hotspotPopupContent.style.cssText = 'padding: 14px; font-family: "Plus Jakarta Sans", sans-serif; width: 280px;';
      hotspotPopupContent.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 800; font-family: monospace; color: #e11d48; text-transform: uppercase;">DBSCAN Cluster</span>
          <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${
            isCritical
              ? 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;'
              : 'background: #fffbeb; color: #b45309; border: 1px solid #fde68a;'
          }">${hs.riskLevel} Risk</span>
        </div>

        <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${escapeHtml(hs.name)}</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">${escapeHtml(hs.locationName)} &bull; ${hs.radius || hs.radiusMeters}m radius</div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 8px;">
          <div style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 4px; font-family: monospace;">Category Breakdown:</div>
          <div style="display: flex; flex-wrap: gap; gap: 4px;">
            ${hs.mainCategories
              .map(
                (c) =>
                  `<span style="font-size: 10px; background: white; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #334155;">${
                    c.count
                  } ${escapeHtml(c.category.split('/')[0].trim())}</span>`
              )
              .join('')}
          </div>
        </div>

        <div style="font-size: 11px; color: #334155; line-height: 1.4; margin-bottom: 10px; background: #fff7ed; padding: 8px; border-radius: 6px; border: 1px solid #fed7aa;">
          <strong style="color: #9a3412;">Dynamic Cluster Note:</strong> "${escapeHtml(hs.detectionNote || 'Potential hotspot detected from repeated reports.')}"
        </div>

        <button id="btn-inspect-${hs.id}" style="width: 100%; font-size: 11px; font-weight: 700; color: white; background: #0f172a; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer;">
          Inspect Hotspot Dossier &rarr;
        </button>
      `;

      const inspectBtn = hotspotPopupContent.querySelector(`#btn-inspect-${hs.id}`);
      if (inspectBtn) {
        inspectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectHotspot?.(hs);
        });
      }

      centerMarker.bindPopup(hotspotPopupContent);
      circle.bindPopup(hotspotPopupContent);

      centerMarker.on('click', () => onSelectHotspot?.(hs));
    });
  }, [hotspots, showHotspots, singleMarker, onSelectHotspot]);

  // Auto-fly to selected hotspot when chosen from parent view
  useEffect(() => {
    if (!selectedHotspotId || !mapInstanceRef.current) return;
    const targetHs = hotspots.find((h) => h.id === selectedHotspotId);
    if (targetHs) {
      mapInstanceRef.current.flyTo([targetHs.center.latitude, targetHs.center.longitude], 16, {
        duration: 1.0,
      });
    }
  }, [selectedHotspotId, hotspots]);

  // Handle Search for address or landmark
  const handleSearch = (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    // First check popular landmarks
    const q = searchQuery.toLowerCase();
    const match = POPULAR_LANDMARKS.find(
      (lm) => lm.name.toLowerCase().includes(q) || lm.address.toLowerCase().includes(q)
    );

    if (match) {
      mapInstanceRef.current.flyTo([match.lat, match.lng], 16, { duration: 1 });
      if (selectable && onLocationSelect) {
        updateSelectionMarker(match.lat, match.lng, false);
        onLocationSelect({
          latitude: match.lat,
          longitude: match.lng,
          address: match.address,
          landmark: match.name,
        });
      }
      setIsSearching(false);
      return;
    }

    // Otherwise geocode query with Nominatim
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          mapInstanceRef.current?.flyTo([lat, lng], 16, { duration: 1 });
          if (selectable && onLocationSelect) {
            updateSelectionMarker(lat, lng, true);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsSearching(false);
      });
  };

  // Locate current position
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      // Default to city center
      mapInstanceRef.current?.flyTo([CITY_BOUNDS.center.lat, CITY_BOUNDS.center.lng], 15, { duration: 1 });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapInstanceRef.current?.flyTo([latitude, longitude], 16, { duration: 1.2 });
        if (selectable && onLocationSelect) {
          updateSelectionMarker(latitude, longitude, true);
        }
        setIsLocating(false);
      },
      () => {
        // Fallback to city center if permission denied or unavailable
        mapInstanceRef.current?.flyTo([CITY_BOUNDS.center.lat, CITY_BOUNDS.center.lng], 15, { duration: 1 });
        setIsLocating(false);
      },
      { timeout: 5000 }
    );
  };

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    mapInstanceRef.current?.flyTo([CITY_BOUNDS.center.lat, CITY_BOUNDS.center.lng], 14, { duration: 1 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
      return next;
    });
  };

  return (
    <div
      className={`relative w-full ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : `${height} rounded-xl`
      } overflow-hidden border border-slate-200/90 bg-slate-100 shadow-2xs select-none transition-all`}
    >
      {/* Interactive Map Canvas (Google Maps or Leaflet Fallback GIS) */}
      {useGoogleMaps && googleMapsApiKey && !googleMapsError ? (
        <GoogleMapCanvas
          apiKey={googleMapsApiKey}
          complaints={filteredComplaints}
          hotspots={hotspots}
          selectedComplaintId={selectedComplaintId}
          selectedHotspotId={selectedHotspotId}
          onSelectComplaint={(id) => {
            const c = complaints.find((item) => item.id === id);
            if (c && onSelectComplaint) onSelectComplaint(c);
          }}
          onSelectHotspot={(id) => {
            const h = hotspots.find((item) => item.id === id);
            if (h && onSelectHotspot) onSelectHotspot(h);
          }}
          selectable={selectable}
          selectedLocation={selectedLocation}
          onLocationSelect={onLocationSelect}
          showHotspots={showHotspots}
          onLoadError={(err) => {
            console.warn('[SmartCityMap] Google Maps load failed, falling back to Demo GIS Map:', err);
            setGoogleMapsError(err);
            setUseGoogleMaps(false);
          }}
        />
      ) : (
        <div ref={mapContainerRef} className={`w-full h-full ${activeTheme === 'dark' ? 'dark-tiles-mode' : ''}`} />
      )}

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Category & Priority Filters */}
        {showFilterControls && !singleMarker && !selectable ? (
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 shadow-2xs pointer-events-auto overflow-x-auto max-w-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono px-2">Filter:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'Pothole / Road', label: 'Roads' },
              { id: 'Garbage / Waste', label: 'Waste' },
              { id: 'Water Leakage', label: 'Water' },
              { id: 'Streetlight', label: 'Lights' },
              { id: 'Traffic', label: 'Traffic' },
              { id: 'Infrastructure', label: 'Infra' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 py-1 px-2 rounded-lg cursor-pointer focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs pointer-events-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {selectable
                ? 'Click anywhere on map to drop or drag pin'
                : singleMarker
                ? singleMarker.title || 'Verified Incident Geotag'
                : 'Live GIS Incident Grid'}
            </span>
          </div>
        )}

        {/* Top Right Controls: Search Toggle, Layers Menu, Theme Switcher */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Search Toggle Button */}
          <button
            type="button"
            onClick={() => setShowSearchBox(!showSearchBox)}
            className={`p-1.5 rounded-xl border shadow-2xs transition-all cursor-pointer ${
              showSearchBox
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-slate-50'
            }`}
            title="Search Address or Landmark"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Layers Popover Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayersMenu(!showLayersMenu)}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border shadow-2xs transition-all cursor-pointer ${
                showLayersMenu
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-slate-50'
              }`}
              title="Toggle Map Layers"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Layers</span>
            </button>

            {showLayersMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white/98 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl p-3 z-30 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-1.5">
                    Base Map Style
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTheme('streets')}
                      className={`py-1 text-[11px] font-semibold rounded-md border text-center transition-all ${
                        activeTheme === 'streets'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Streets
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTheme('satellite')}
                      className={`py-1 text-[11px] font-semibold rounded-md border text-center transition-all ${
                        activeTheme === 'satellite'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Satellite
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTheme('dark')}
                      className={`py-1 text-[11px] font-semibold rounded-md border text-center transition-all ${
                        activeTheme === 'dark'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Night
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                    Overlays & Markers
                  </span>

                  <label className="flex items-center justify-between cursor-pointer text-slate-700 hover:text-slate-900">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showIncidents}
                        onChange={(e) => setShowIncidents(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span>Incident Markers</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{complaints.length}</span>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer text-slate-700 hover:text-slate-900">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showHotspots}
                        onChange={(e) => setShowHotspots(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                      />
                      <span>Hotspot Clusters</span>
                    </div>
                    <span className="font-mono text-[10px] text-rose-500 font-bold">{hotspots.length}</span>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer text-slate-700 hover:text-slate-900">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showLandmarks}
                        onChange={(e) => setShowLandmarks(e.target.checked)}
                        className="rounded text-slate-800 focus:ring-slate-700 w-3.5 h-3.5"
                      />
                      <span>Civic Landmarks</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{POPULAR_LANDMARKS.length}</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Quick theme switcher buttons */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 shadow-2xs hidden sm:flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setActiveTheme('streets')}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                activeTheme === 'streets'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Streets
            </button>
            <button
              type="button"
              onClick={() => setActiveTheme('satellite')}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                activeTheme === 'satellite'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setActiveTheme('dark')}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                activeTheme === 'dark'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Night
            </button>
          </div>
        </div>
      </div>

      {/* Floating Search Bar (selectable or toggled via button) */}
      {showSearchBox && (
        <div className="absolute top-14 left-3 z-20 pointer-events-auto">
          <div
            className="flex items-center"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleSearch(e);
              }
            }}
          >
            <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search street, district, or landmark..."
                className="text-xs pl-8 pr-3 py-1.5 w-56 sm:w-72 focus:outline-none text-slate-900 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearch(e);
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white mr-1 rounded-lg hover:bg-slate-800 cursor-pointer font-mono"
                >
                  Go
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Status / Geocoding Indicator */}
      {reverseGeocoding && (
        <div className="absolute top-14 right-3 z-20 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-2xs text-[11px] font-mono flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-spin" />
          <span>Resolving address...</span>
        </div>
      )}

      {/* Bottom Floating Map Controls (Zoom, Locate, Recenter, Fullscreen) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={handleLocateMe}
          title="Locate my position"
          disabled={isLocating}
          className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        <button
          type="button"
          onClick={handleRecenter}
          title="Recenter Map to City Center"
          className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4" />
        </button>

        <div className="bg-white/95 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col divide-y divide-slate-100 overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-8 h-8 hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-8 h-8 hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Left: Map Provider & Stats indicator */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-auto flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-slate-300 flex items-center gap-2 border border-slate-700 shadow-md">
          <span
            className={`w-2 h-2 rounded-full ${
              useGoogleMaps && googleMapsApiKey && !googleMapsError
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-amber-400'
            }`}
          />
          <span className="font-semibold text-white">
            {useGoogleMaps && googleMapsApiKey && !googleMapsError ? 'Google Maps' : 'Demo GIS Map'}
          </span>
          <span className="text-slate-500">&bull;</span>
          <span>
            {CITY_BOUNDS.center.lat.toFixed(3)}°N, {Math.abs(CITY_BOUNDS.center.lng).toFixed(3)}°E
          </span>
          <span className="text-slate-500">&bull;</span>
          <span>Zoom {currentZoom}x</span>
          {googleMapsApiKey && (
            <>
              <span className="text-slate-500">&bull;</span>
              <button
                type="button"
                onClick={() => setUseGoogleMaps(!useGoogleMaps)}
                className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Switch to {useGoogleMaps ? 'Demo GIS Map' : 'Google Maps'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
