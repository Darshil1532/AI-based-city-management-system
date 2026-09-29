import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Complaint, Hotspot } from '../../types';
import { CITY_BOUNDS } from '../../data/mockData';
import { createSafeComplaintInfoWindow, createSafeHotspotInfoWindow, escapeHtml } from '../../utils/domSafe';

export interface GoogleMapCanvasHandle {
  locateMe: () => Promise<{ latitude: number; longitude: number; address: string; landmark?: string }>;
  recenter: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  panTo: (lat: number, lng: number, zoom?: number) => void;
  setMapType: (type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => void;
}

interface GoogleMapCanvasProps {
  apiKey: string;
  complaints: Complaint[];
  hotspots: Hotspot[];
  selectedComplaintId?: string | null;
  selectedHotspotId?: string | null;
  onSelectComplaint?: (id: string) => void;
  onSelectHotspot?: (id: string) => void;
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

/**
 * Robust loader for Google Maps JavaScript API with places and geometry libraries.
 */
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
      apiKey.trim()
    )}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error('Failed to load Google Maps script from Google CDN'));
    document.head.appendChild(script);
  });

  return window.__googleMapsLoadingPromise;
}

export const GoogleMapCanvas = forwardRef<GoogleMapCanvasHandle, GoogleMapCanvasProps>(
  (
    {
      apiKey,
      complaints,
      hotspots,
      selectedComplaintId,
      selectedHotspotId,
      onSelectComplaint,
      onSelectHotspot,
      selectable,
      selectedLocation,
      onLocationSelect,
      showHotspots,
      focusLocation,
      onLoadError,
    },
    ref
  ) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const circlesRef = useRef<any[]>([]);
    const pickerMarkerRef = useRef<any>(null);
    const userLocationMarkerRef = useRef<any>(null);
    const activeInfoWindowRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load Google Maps Script
  useEffect(() => {
    if (!apiKey) {
      onLoadError?.('No Google Maps API Key provided in environment (VITE_GOOGLE_MAPS_API_KEY).');
      return;
    }

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

  // Helper for reverse geocoding on click/drag
  const handleGeocodeAndSelect = useCallback(
    (lat: number, lng: number) => {
      if (!onLocationSelect || !window.google?.maps) return;

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
    },
    [onLocationSelect]
  );

  // 2. Initialize Map Instance & Centering
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      const initialCenter = selectedLocation
        ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
        : focusLocation
        ? { lat: focusLocation.latitude, lng: focusLocation.longitude }
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
    }
  }, [isLoaded, focusLocation, selectedLocation]);

  // 2b. Attach / update click listener for selectable mode
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !selectable) return;

    const listener = mapInstanceRef.current.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      handleGeocodeAndSelect(lat, lng);
    });

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [isLoaded, selectable, handleGeocodeAndSelect]);

  // 3. Render Complaint Markers & Selected Complaint Focus (XSS Safe)
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    complaints.forEach((c) => {
      if (!c.location?.latitude || !c.location?.longitude) return;

      const pos = { lat: c.location.latitude, lng: c.location.longitude };
      const isSelected = c.id === selectedComplaintId;

      // Color coding based on status & priority
      let fillColor = '#3b82f6'; // Blue
      if (c.status === 'resolved') {
        fillColor = '#10b981'; // Green
      } else if (c.priority === 'High' || c.severity === 'High') {
        fillColor = '#ef4444'; // Red
      } else if (c.priority === 'Medium') {
        fillColor = '#f59e0b'; // Amber
      }

      // Safe plain text title for tooltip
      const sanitizedTitle = `${escapeHtml(c.id)}: ${escapeHtml(c.title)}`;

      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: sanitizedTitle,
        animation: isSelected ? window.google.maps.Animation.BOUNCE : undefined,
        zIndex: isSelected ? 100 : 10,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 10 : 7,
          fillColor,
          fillOpacity: isSelected ? 1 : 0.85,
          strokeWeight: isSelected ? 3 : 2,
          strokeColor: '#ffffff',
        },
      });

      // DOM-Safe InfoWindow (Zero XSS vulnerability)
      const safeNode = createSafeComplaintInfoWindow(c, (id) => {
        if (onSelectComplaint) onSelectComplaint(id);
      });
      const infoWindow = new window.google.maps.InfoWindow({
        content: safeNode,
      });

      marker.addListener('click', () => {
        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close();
        }
        infoWindow.open(mapInstanceRef.current, marker);
        activeInfoWindowRef.current = infoWindow;
        if (onSelectComplaint) onSelectComplaint(c.id);
      });

      // If this complaint was just selected externally, open info and center
      if (isSelected) {
        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close();
        }
        infoWindow.open(mapInstanceRef.current, marker);
        activeInfoWindowRef.current = infoWindow;
        mapInstanceRef.current.panTo(pos);
        mapInstanceRef.current.setZoom(16);
      }

      markersRef.current.push(marker);
    });
  }, [isLoaded, complaints, selectedComplaintId, onSelectComplaint]);

  // 4. Render Hotspot Circles with Safe InfoWindows
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    // Clear old circles
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    if (!showHotspots) return;

    hotspots.forEach((h) => {
      if (!h.center?.latitude || !h.center?.longitude) return;

      const isSelected = h.id === selectedHotspotId;
      const isCritical = h.riskLevel === 'Critical';
      const strokeColor = isCritical ? '#dc2626' : '#ea580c';
      const radius = h.radius || h.radiusMeters || 400;

      const circle = new window.google.maps.Circle({
        strokeColor,
        strokeOpacity: isSelected ? 0.95 : 0.8,
        strokeWeight: isSelected ? 3 : 2,
        fillColor: strokeColor,
        fillOpacity: isSelected ? 0.28 : 0.16,
        map: mapInstanceRef.current,
        center: { lat: h.center.latitude, lng: h.center.longitude },
        radius,
        zIndex: isSelected ? 50 : 5,
      });

      // Hotspot click opens DOM-safe hotspot InfoWindow
      circle.addListener('click', (e: any) => {
        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close();
        }
        const safeNode = createSafeHotspotInfoWindow(h, (id) => {
          if (onSelectHotspot) onSelectHotspot(id);
        });
        const infoWindow = new window.google.maps.InfoWindow({
          content: safeNode,
          position: e.latLng,
        });
        infoWindow.open(mapInstanceRef.current);
        activeInfoWindowRef.current = infoWindow;
        if (onSelectHotspot) onSelectHotspot(h.id);
      });

      circlesRef.current.push(circle);
    });
  }, [isLoaded, hotspots, showHotspots, selectedHotspotId, onSelectHotspot]);

  // 5. Render Picker Location Pin (Draggable for interactive selection)
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.setMap(null);
      pickerMarkerRef.current = null;
    }

    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      const pos = { lat: selectedLocation.latitude, lng: selectedLocation.longitude };
      const pickerMarker = new window.google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: escapeHtml(selectedLocation.address || 'Selected Location Pin'),
        draggable: !!selectable,
        zIndex: 200,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
      });

      if (selectable) {
        pickerMarker.addListener('dragend', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          handleGeocodeAndSelect(lat, lng);
        });
      }

      pickerMarkerRef.current = pickerMarker;
    }
  }, [isLoaded, selectedLocation, selectable, handleGeocodeAndSelect]);

  // 6. Handle Location Focus updates
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !focusLocation) return;
    mapInstanceRef.current.panTo({ lat: focusLocation.latitude, lng: focusLocation.longitude });
    mapInstanceRef.current.setZoom(16);
  }, [isLoaded, focusLocation]);

  // 7. Expose imperative handle methods to parent SmartCityMap
  useImperativeHandle(
    ref,
    () => ({
      locateMe: async () => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser.'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = Number(pos.coords.latitude.toFixed(6));
              const lng = Number(pos.coords.longitude.toFixed(6));

              if (mapInstanceRef.current && window.google?.maps) {
                const userLatLng = { lat, lng };
                mapInstanceRef.current.panTo(userLatLng);
                mapInstanceRef.current.setZoom(16);

                // Create or update dedicated user location marker
                if (userLocationMarkerRef.current) {
                  userLocationMarkerRef.current.setPosition(userLatLng);
                } else {
                  userLocationMarkerRef.current = new window.google.maps.Marker({
                    position: userLatLng,
                    map: mapInstanceRef.current,
                    title: 'Your Current Location',
                    zIndex: 350,
                    icon: {
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: '#2563eb',
                      fillOpacity: 1,
                      strokeWeight: 3,
                      strokeColor: '#ffffff',
                    },
                  });
                }
              }

              // Reverse geocode to get real street address
              if (window.google?.maps) {
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
                  let addr = `${lat}°N, ${lng}°E (Current Device Location)`;
                  let landmark = 'Current Location';

                  if (status === 'OK' && results && results[0]) {
                    addr = results[0].formatted_address;
                    landmark = results[0].address_components?.[0]?.long_name || landmark;
                  }

                  if (selectable && onLocationSelect) {
                    onLocationSelect({
                      latitude: lat,
                      longitude: lng,
                      address: addr,
                      landmark,
                    });
                  }

                  resolve({ latitude: lat, longitude: lng, address: addr, landmark });
                });
              } else {
                const fallbackAddr = `${lat}°N, ${lng}°E`;
                if (selectable && onLocationSelect) {
                  onLocationSelect({
                    latitude: lat,
                    longitude: lng,
                    address: fallbackAddr,
                    landmark: 'Current Location',
                  });
                }
                resolve({ latitude: lat, longitude: lng, address: fallbackAddr, landmark: 'Current Location' });
              }
            },
            (err) => {
              let msg = 'Failed to retrieve current location.';
              if (err.code === 1) msg = 'Location permission was denied. Please allow location access in your browser settings.';
              else if (err.code === 2) msg = 'Location is unavailable on this network/device.';
              else if (err.code === 3) msg = 'Location request timed out. Please try again.';
              reject(new Error(msg));
            },
            {
              enableHighAccuracy: true,
              timeout: 12000,
              maximumAge: 30000,
            }
          );
        });
      },

      recenter: () => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.panTo(CITY_BOUNDS.center);
        mapInstanceRef.current.setZoom(CITY_BOUNDS.zoom);
      },

      zoomIn: () => {
        if (!mapInstanceRef.current) return;
        const current = mapInstanceRef.current.getZoom() || 14;
        mapInstanceRef.current.setZoom(current + 1);
      },

      zoomOut: () => {
        if (!mapInstanceRef.current) return;
        const current = mapInstanceRef.current.getZoom() || 14;
        mapInstanceRef.current.setZoom(Math.max(1, current - 1));
      },

      panTo: (lat: number, lng: number, zoom?: number) => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.panTo({ lat, lng });
        if (zoom) mapInstanceRef.current.setZoom(zoom);
      },

      setMapType: (type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.setMapTypeId(type);
      },
    }),
    [selectable, onLocationSelect]
  );

  return (
    <div className="w-full h-full relative" style={{ minHeight: '100%' }}>
      {/* Google Maps Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
});

GoogleMapCanvas.displayName = 'GoogleMapCanvas';
