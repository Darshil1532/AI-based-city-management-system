import React, { useEffect, useRef, useState } from 'react';
import { Complaint, Hotspot, LocationCoordinates } from '../../types';
import { CITY_BOUNDS } from '../../data/mockData';

interface GoogleMapCanvasProps {
  apiKey: string;
  complaints: Complaint[];
  hotspots: Hotspot[];
  selectedComplaintId?: string | null;
  onSelectComplaint?: (id: string) => void;
  selectable?: boolean;
  selectedLocation?: { latitude: number; longitude: number; address?: string } | null;
  onLocationSelect?: (loc: {
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
  }) => void;
  showHotspots: boolean;
  focusLocation?: { latitude: number; longitude: number } | null;
  onLoadError?: (error: string) => void;
}

declare global {
  interface Window {
    google: any;
    __googleMapsLoadingPromise?: Promise<void>;
  }
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (window.google?.maps) {
    return Promise.resolve();
  }
  if (window.__googleMapsLoadingPromise) {
    return window.__googleMapsLoadingPromise;
  }

  window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return window.__googleMapsLoadingPromise;
}

export const GoogleMapCanvas: React.FC<GoogleMapCanvasProps> = ({
  apiKey,
  complaints,
  hotspots,
  selectedComplaintId,
  onSelectComplaint,
  selectable,
  selectedLocation,
  onLocationSelect,
  showHotspots,
  focusLocation,
  onLoadError,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const pickerMarkerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load Google Maps Script
  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (isMounted) setIsLoaded(true);
      })
      .catch((err) => {
        console.warn('[Google Maps] Script load failed:', err);
        if (isMounted && onLoadError) {
          onLoadError(err?.message || 'Google Maps failed to load');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey, onLoadError]);

  // 2. Initialize Map Instance
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      const initialCenter = selectedLocation
        ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
        : CITY_BOUNDS.center;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: CITY_BOUNDS.zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
          { featureType: 'transit', stylers: [{ visibility: 'on' }] },
        ],
      });

      mapInstanceRef.current = map;

      // Click listener for selectable mode
      if (selectable && onLocationSelect) {
        map.addListener('click', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
            let addr = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Selected Location)`;
            let landmark = 'Selected Location';
            if (status === 'OK' && results && results[0]) {
              addr = results[0].formatted_address;
              landmark = results[0].address_components?.[0]?.long_name || landmark;
            }
            onLocationSelect({
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
              address: addr,
              landmark,
            });
          });
        });
      }
    }
  }, [isLoaded, selectable, onLocationSelect, selectedLocation]);

  // 3. Render Complaint Markers
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    complaints.forEach((c) => {
      if (!c.location?.latitude || !c.location?.longitude) return;

      const pos = { lat: c.location.latitude, lng: c.location.longitude };
      bounds.extend(pos);
      hasCoords = true;

      const isSelected = c.id === selectedComplaintId;

      // Marker pin colors
      let fillColor = '#3b82f6'; // blue
      if (c.severity === 'High' || c.priority === 'High') fillColor = '#ef4444'; // red
      else if (c.status === 'resolved') fillColor = '#10b981'; // green

      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: `${c.id}: ${c.title}`,
        animation: isSelected ? window.google.maps.Animation.BOUNCE : undefined,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 9 : 7,
          fillColor,
          fillOpacity: 0.9,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
      });

      const infoContent = `
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px; max-width: 220px;">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">${c.id}: ${c.category}</div>
          <div style="color: #475569; margin-bottom: 4px;">${c.title}</div>
          <div style="font-size: 10px; color: #64748b;">${c.location.address}</div>
          <div style="margin-top: 6px; font-weight: bold; color: ${
            c.status === 'resolved' ? '#059669' : '#d97706'
          };">Status: ${c.status}</div>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({ content: infoContent });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        if (onSelectComplaint) onSelectComplaint(c.id);
      });

      markersRef.current.push(marker);
    });
  }, [isLoaded, complaints, selectedComplaintId, onSelectComplaint]);

  // 4. Render Hotspot Circles
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    // Clear old circles
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    if (!showHotspots) return;

    hotspots.forEach((h) => {
      if (!h.center?.latitude || !h.center?.longitude) return;

      const circle = new window.google.maps.Circle({
        strokeColor: '#ef4444',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        map: mapInstanceRef.current,
        center: { lat: h.center.latitude, lng: h.center.longitude },
        radius: h.radiusMeters || 350,
      });

      circlesRef.current.push(circle);
    });
  }, [isLoaded, hotspots, showHotspots]);

  // 5. Render Picker Location Pin
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.setMap(null);
      pickerMarkerRef.current = null;
    }

    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      const pos = { lat: selectedLocation.latitude, lng: selectedLocation.longitude };
      pickerMarkerRef.current = new window.google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: selectedLocation.address || 'Selected Location',
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
      });
    }
  }, [isLoaded, selectedLocation]);

  // 6. Handle Focus Location
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !focusLocation) return;
    mapInstanceRef.current.panTo({ lat: focusLocation.latitude, lng: focusLocation.longitude });
    mapInstanceRef.current.setZoom(16);
  }, [isLoaded, focusLocation]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full relative"
      style={{ minHeight: '100%' }}
    />
  );
};
