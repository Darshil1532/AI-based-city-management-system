import React, { useState } from 'react';
import { LocationCoordinates } from '../../types';
import { SmartCityMap } from './SmartCityMap';
import { POPULAR_LANDMARKS } from '../../data/mockData';
import { MapPin, Navigation, Compass, Building, Check, AlertTriangle } from 'lucide-react';

interface LocationPickerProps {
  value: LocationCoordinates;
  onChange: (location: LocationCoordinates) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
}) => {
  const [useGpsLoading, setUseGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const handleMapSelect = (loc: {
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
  }) => {
    onChange({
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: loc.address,
      landmark: loc.landmark || value.landmark || '',
      district: loc.landmark?.includes('Market')
        ? 'Downtown Commercial'
        : loc.landmark?.includes('Highland')
        ? 'South Highland District'
        : 'Midtown Transit Corridor',
    });
  };

  const handleSelectLandmark = (landmark: (typeof POPULAR_LANDMARKS)[0]) => {
    onChange({
      latitude: landmark.lat,
      longitude: landmark.lng,
      address: landmark.address,
      landmark: landmark.name,
      district: landmark.district,
    });
  };

  const handleSimulateGPS = () => {
    setUseGpsLoading(true);
    setGpsMessage(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          onChange({
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6)),
            address: `${latitude.toFixed(4)}°N, ${Math.abs(longitude).toFixed(4)}°W (GPS Geotag)`,
            landmark: 'Device Geolocation',
            district: 'Detected Location',
          });
          setUseGpsLoading(false);
          setGpsMessage('Location acquired via GPS coordinates.');
          setTimeout(() => setGpsMessage(null), 3000);
        },
        () => {
          // Fallback to City Center Market Street
          onChange({
            latitude: 37.7758,
            longitude: -122.4182,
            address: '428 Market Street, Downtown',
            landmark: 'Near Downtown Market Entrance Gate B',
            district: 'Downtown Commercial',
          });
          setUseGpsLoading(false);
          setGpsMessage('Set to default Downtown municipal center.');
          setTimeout(() => setGpsMessage(null), 3000);
        },
        { timeout: 6000 }
      );
    } else {
      onChange({
        latitude: 37.7758,
        longitude: -122.4182,
        address: '428 Market Street, Downtown',
        landmark: 'Near Downtown Market Entrance Gate B',
        district: 'Downtown Commercial',
      });
      setUseGpsLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          Location & Geographic Pin <span className="text-rose-500">*</span>
        </label>

        <button
          type="button"
          onClick={handleSimulateGPS}
          disabled={useGpsLoading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Navigation className={`w-3 h-3 ${useGpsLoading ? 'animate-spin' : ''}`} />
          <span>{useGpsLoading ? 'Locating...' : 'Use Current Device GPS'}</span>
        </button>
      </div>

      {gpsMessage && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2">
          <span>{gpsMessage}</span>
        </div>
      )}

      {/* Interactive Map for selection */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        <SmartCityMap
          selectable={true}
          selectedLocation={{
            latitude: value.latitude,
            longitude: value.longitude,
            address: value.address,
          }}
          onLocationSelect={handleMapSelect}
          height="h-[280px] sm:h-[320px]"
          showHotspotsByDefault={false}
          showFilterControls={false}
        />
      </div>

      {/* Popular Municipal Landmarks quick pills */}
      <div>
        <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
          Or pick from popular city landmarks:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_LANDMARKS.map((lm) => {
            const isSelected =
              Math.abs(value.latitude - lm.lat) < 0.001 &&
              Math.abs(value.longitude - lm.lng) < 0.001;
            return (
              <button
                key={lm.name}
                type="button"
                onClick={() => handleSelectLandmark(lm)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {isSelected ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <Building className="w-3 h-3 text-slate-400" />
                )}
                <span>{lm.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coordinate & Address Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Street Address or Cross Street
          </label>
          <input
            type="text"
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            placeholder="e.g. 428 Market Street, Downtown"
            required
            className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Landmark / Specific Location Clue
          </label>
          <input
            type="text"
            value={value.landmark || ''}
            onChange={(e) => onChange({ ...value, landmark: e.target.value })}
            placeholder="e.g. Main Market Entrance Gate B, near fruit stall"
            className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Live Coordinate Display */}
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Coordinates:</span>
          <code className="font-mono font-semibold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            {value.latitude.toFixed(4)}° N, {value.longitude.toFixed(4)}° W
          </code>
        </div>
        <span className="text-slate-400 text-[10px]">
          {value.district ? `District: ${value.district}` : 'Municipal Grid System'}
        </span>
      </div>
    </div>
  );
};
