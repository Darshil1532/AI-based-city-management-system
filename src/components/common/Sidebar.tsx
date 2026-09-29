import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Search,
  MapPin,
  Flame,
  BarChart3,
  Lightbulb,
  Building,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
  isOpenMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { activePersona, complaints, allComplaints, hotspots, aiInsights } = useApp();
  const location = useLocation();

  const pendingCount = (allComplaints || complaints).filter((c) => c.status === 'submitted').length;
  const activeHotspotsCount = hotspots.filter((h) => h.status === 'active').length;
  const newInsightsCount = aiInsights.filter((i) => i.status === 'new').length;

  const citizenNavItems = [
    {
      to: '/citizen/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/citizen/report',
      label: 'Report an Issue',
      icon: PlusCircle,
      badge: 'New',
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      to: '/citizen/my-complaints',
      label: 'My Complaints',
      icon: FileText,
      badge: complaints.length.toString(),
    },
    {
      to: '/track',
      label: 'Track Complaint',
      icon: Search,
      badge: null,
    },
    {
      to: '/citizen/map',
      label: 'City Issue Map',
      icon: MapPin,
      badge: null,
    },
  ];

  const adminNavItems = [
    {
      to: '/admin/dashboard',
      label: 'Overview & Triage',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/admin/complaints',
      label: 'All Complaints',
      icon: FileText,
      badge: pendingCount > 0 ? `${pendingCount} new` : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      to: '/admin/map',
      label: 'Geographic GIS Map',
      icon: MapPin,
      badge: null,
    },
    {
      to: '/admin/hotspots',
      label: 'Hotspot Detection',
      icon: Flame,
      badge: activeHotspotsCount > 0 ? `${activeHotspotsCount} active` : null,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      to: '/admin/analytics',
      label: 'Analytics & KPIs',
      icon: BarChart3,
      badge: null,
    },
    {
      to: '/admin/insights',
      label: 'AI Recommendations',
      icon: Lightbulb,
      badge: newInsightsCount > 0 ? `${newInsightsCount} alert` : null,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      to: '/admin/departments',
      label: 'Municipal Departments',
      icon: Building,
      badge: null,
    },
    {
      to: '/admin/settings',
      label: 'System & Maps Config',
      icon: Settings,
      badge: null,
    },
  ];

  const items = activePersona === 'admin' ? adminNavItems : citizenNavItems;

  return (
    <aside className="w-64 clay-sidebar flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Context Badge */}
      <div className="p-4 border-b border-slate-200/50 bg-white/40">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            {activePersona === 'admin' ? 'Administrative Suite' : 'Citizen Services'}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold clay-badge-emerald px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live System
          </span>
        </div>
        <p className="text-xs font-bold text-slate-900 mt-1.5 tracking-tight">
          {activePersona === 'admin'
            ? 'City Operations Center'
            : 'Public Civic Portal'}
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/admin/dashboard' &&
              item.to !== '/citizen/dashboard' &&
              location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? activePersona === 'admin'
                    ? 'clay-btn-primary text-white shadow-xs font-semibold'
                    : 'clay-btn-blue text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-white/90 hover:shadow-2xs hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1.5 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor || 'clay-badge bg-white text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-3.5 clay-card m-3 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Decision Support</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          AI suggests triage priority & routing. City officials authorize all municipal work orders.
        </p>
      </div>
    </aside>
  );
};
