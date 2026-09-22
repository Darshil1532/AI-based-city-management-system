import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPinOff,
  KeyRound,
  ShieldAlert,
  Clock,
  Settings,
  ArrowRight,
  ExternalLink,
  Layers,
  RotateCcw,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { mapsRateLimiter, RateLimitStatus } from '../../utils/rateLimiter';

export type MapUnavailableReason =
  | 'missing_key'
  | 'invalid_key'
  | 'rate_limited'
  | 'network_error';

interface MapUnavailablePlaceholderProps {
  reason?: MapUnavailableReason;
  onUseFallbackMap?: () => void;
  onRetry?: () => void;
  height?: string;
  isCompact?: boolean;
}

export const MapUnavailablePlaceholder: React.FC<MapUnavailablePlaceholderProps> = ({
  reason = 'missing_key',
  onUseFallbackMap,
  onRetry,
  height = 'h-80',
  isCompact = false,
}) => {
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus>(() =>
    mapsRateLimiter.getStatus()
  );

  useEffect(() => {
    const unsubscribe = mapsRateLimiter.subscribe((status) => {
      setRateLimitStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // Determine active display mode
  const effectiveReason = rateLimitStatus.isLimited ? 'rate_limited' : reason;

  const contentMap: Record<
    MapUnavailableReason,
    {
      title: string;
      subtitle: string;
      description: string;
      icon: React.ComponentType<{ className?: string }>;
      badgeColor: string;
      badgeText: string;
    }
  > = {
    missing_key: {
      title: 'Google Maps API Key Not Configured',
      subtitle: 'External satellite & geocoding tiles unavailable',
      description:
        'A valid Google Maps JavaScript API key has not been supplied in the environment. The municipal system has automatically enabled the built-in offline GIS vector map so civic workflows remain 100% operational.',
      icon: KeyRound,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      badgeText: 'API Key Required',
    },
    invalid_key: {
      title: 'Google Maps API Key Verification Failed',
      subtitle: 'Authentication rejected or domain referrer restricted',
      description:
        'The provided Google Maps API key could not be verified by Google Cloud services (HTTP 403 / RefererNotAllowedMapError). Please verify that the key has Maps JavaScript API enabled and authorized.',
      icon: ShieldAlert,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      badgeText: 'Invalid Key',
    },
    rate_limited: {
      title: 'Maps API Rate Limit Exceeded',
      subtitle: 'Sliding window throttling active to prevent quota exhaustion',
      description: `Client-side rate limit triggered: maximum threshold of ${rateLimitStatus.maxRequests} requests per ${rateLimitStatus.windowSeconds}s reached. Tile requests and reverse geocoding are temporarily paused.`,
      icon: Clock,
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      badgeText: `Rate Limited (${rateLimitStatus.remainingSeconds}s cooldown)`,
    },
    network_error: {
      title: 'Map Service Connectivity Issue',
      subtitle: 'Unable to reach Google Maps CDN endpoints',
      description:
        'Network communication with maps.googleapis.com timed out. The local high-resolution municipal spatial engine is serving all coordinates and hotspots uninterrupted.',
      icon: MapPinOff,
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      badgeText: 'Network Timeout',
    },
  };

  const current = contentMap[effectiveReason];
  const IconComponent = current.icon;

  if (isCompact) {
    return (
      <div
        id="map-unavailable-compact"
        className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs"
      >
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="text-slate-800">
            <span className="font-bold text-amber-900">{current.title}</span>
            <span className="text-slate-600 ml-1.5 hidden sm:inline">
              — Offline GIS engine active.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onUseFallbackMap && (
            <button
              type="button"
              onClick={onUseFallbackMap}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100/50 transition-colors"
            >
              Use GIS Map
            </button>
          )}
          <Link
            to="/admin/settings"
            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      id="map-unavailable-full"
      className={`relative w-full ${height} bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center overflow-hidden`}
    >
      {/* Subtle grid background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #f8fafc 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 max-w-lg space-y-4">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs mx-auto animate-in fade-in"
          style={{ backgroundColor: 'white' }}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              effectiveReason === 'rate_limited'
                ? 'bg-orange-500 animate-ping'
                : effectiveReason === 'invalid_key'
                ? 'bg-rose-500'
                : 'bg-amber-500'
            }`}
          />
          <span className="text-slate-700 font-medium text-[11px]">
            {current.badgeText}
          </span>
        </div>

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center mx-auto text-slate-700">
          <IconComponent className="w-6 h-6 text-slate-700" />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            {current.title}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {current.subtitle}
          </p>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto pt-1">
            {current.description}
          </p>
        </div>

        {/* Rate Limiting Active Cooldown Bar */}
        {effectiveReason === 'rate_limited' && (
          <div className="p-3 bg-white rounded-lg border border-orange-200 text-xs space-y-2 max-w-md mx-auto shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1 text-orange-700">
                <Clock className="w-3.5 h-3.5" />
                Automatic Cooling Window
              </span>
              <span className="font-mono text-orange-600 font-bold">
                {rateLimitStatus.remainingSeconds}s remaining
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (rateLimitStatus.remainingSeconds / rateLimitStatus.windowSeconds) * 100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Threshold: {rateLimitStatus.maxRequests} req / {rateLimitStatus.windowSeconds}s</span>
              <button
                type="button"
                onClick={() => mapsRateLimiter.reset()}
                className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
              >
                Reset Rate Limit (Dev/Testing)
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {onUseFallbackMap && (
            <button
              type="button"
              onClick={onUseFallbackMap}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Use Built-In Vector GIS Map</span>
            </button>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          )}

          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Maps in Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
