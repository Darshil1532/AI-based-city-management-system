import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  Search,
  Building2,
  FileText,
  X,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  ExternalLink,
  CornerDownLeft,
  Command,
} from 'lucide-react';
import { ComplaintSearchResult, DepartmentSearchResult } from '../../types';

interface DashboardCommandBarProps {
  onDepartmentSelect?: (deptName: string) => void;
  onComplaintSelect?: (complaintId: string) => void;
  currentSearchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeDepartmentFilter?: string;
}

export const DashboardCommandBar: React.FC<DashboardCommandBarProps> = ({
  onDepartmentSelect,
  onComplaintSelect,
  currentSearchQuery = '',
  onSearchChange,
  activeDepartmentFilter,
}) => {
  const { searchDatabase, departments, openCommandBar } = useApp();
  const navigate = useNavigate();

  const [localQuery, setLocalQuery] = useState(currentSearchQuery);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external search query
  useEffect(() => {
    setLocalQuery(currentSearchQuery);
  }, [currentSearchQuery]);

  // Click outside to close live dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time database query across complaints & departments
  const searchResults = useMemo(() => {
    if (!localQuery.trim()) {
      return {
        query: '',
        complaints: [],
        departments: [],
        totalMatches: 0,
      };
    }
    return searchDatabase(localQuery, { limit: 6 });
  }, [localQuery, searchDatabase]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => {
    const items: Array<{
      type: 'complaint' | 'department';
      data: ComplaintSearchResult | DepartmentSearchResult;
    }> = [];

    searchResults.departments.forEach((d) => items.push({ type: 'department', data: d }));
    searchResults.complaints.forEach((c) => items.push({ type: 'complaint', data: c }));
    return items;
  }, [searchResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
    setIsDropdownOpen(true);
    setSelectedIndex(0);
  };

  const handleClear = () => {
    setLocalQuery('');
    if (onSearchChange) {
      onSearchChange('');
    }
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      return;
    }

    if (!isDropdownOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsDropdownOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      }
      return;
    }

    if (e.key === 'Enter') {
      if (flatItems.length > 0 && flatItems[selectedIndex]) {
        e.preventDefault();
        handleSelectItem(flatItems[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item: {
    type: 'complaint' | 'department';
    data: ComplaintSearchResult | DepartmentSearchResult;
  }) => {
    setIsDropdownOpen(false);
    if (item.type === 'complaint') {
      const complaint = (item.data as ComplaintSearchResult).item;
      if (onComplaintSelect) {
        onComplaintSelect(complaint.id);
      } else {
        navigate(`/admin/complaint/${complaint.id}`);
      }
    } else {
      const dept = (item.data as DepartmentSearchResult).item;
      if (onDepartmentSelect) {
        onDepartmentSelect(dept.name);
      } else {
        navigate('/admin/departments');
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2.5">
      {/* Search Input Bar */}
      <div className="relative flex items-center clay-inset rounded-2xl transition-all">
        <div className="pl-3.5 pr-2 text-slate-400">
          <Search className="w-4 h-4 text-slate-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (localQuery.trim()) {
              setIsDropdownOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search database by complaint ID (SC1024), category, or department (Sanitation, Public Works)..."
          className="w-full py-2.5 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-hidden font-medium"
        />

        <div className="flex items-center gap-1.5 pr-3 shrink-0">
          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => openCommandBar(localQuery)}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 clay-btn clay-btn-secondary rounded-lg text-[11px] font-mono transition-all cursor-pointer"
            title="Open Full Command Palette (Cmd+K or /)"
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </button>
        </div>
      </div>

      {/* Quick Department Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono shrink-0 mr-1">
          Quick Filter:
        </span>
        {departments.slice(0, 5).map((dept) => {
          const isSelected = activeDepartmentFilter === dept.name;
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => {
                if (onDepartmentSelect) {
                  onDepartmentSelect(isSelected ? 'all' : dept.name);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'clay-btn clay-btn-primary'
                  : 'clay-btn clay-btn-secondary text-slate-600'
              }`}
            >
              <Building2 className={`w-3 h-3 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`} />
              <span>{dept.name.replace(' Department', '').replace(' Division', '')}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {dept.activeComplaints}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Dropdown Search Results */}
      {isDropdownOpen && localQuery.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 z-30 overflow-hidden max-h-96 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 duration-100">
          {flatItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No complaints or departments found matching &quot;{localQuery}&quot;. Press{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">⌘K</kbd>{' '}
              for full command options.
            </div>
          ) : (
            <>
              {/* Header stats */}
              <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>
                  Database Results ({searchResults.totalMatches})
                </span>
                <span className="text-[10px] text-slate-400">
                  ↑↓ to navigate • ↵ to select
                </span>
              </div>

              {/* Department Matches */}
              {searchResults.departments.length > 0 && (
                <div className="p-1.5 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-blue-600" />
                    <span>Matching Departments ({searchResults.departments.length})</span>
                  </div>
                  {searchResults.departments.map((dRes) => {
                    const idx = flatItems.findIndex(
                      (fi) => fi.type === 'department' && (fi.data as DepartmentSearchResult).item.id === dRes.item.id
                    );
                    const isSelected = selectedIndex === idx;
                    const dept = dRes.item;

                    return (
                      <div
                        key={dept.id}
                        onClick={() => handleSelectItem({ type: 'department', data: dRes })}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected ? 'bg-blue-50/90 text-blue-950' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-blue-300" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {dept.name}
                              </span>
                              <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {dept.activeComplaints} Active
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              Lead: {dept.head} • SLA: {dept.avgResolutionHours}h • Efficiency: {dept.efficiencyScore}%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-medium text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Filter className="w-2.5 h-2.5" />
                            <span>Filter Table</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Complaint Matches */}
              {searchResults.complaints.length > 0 && (
                <div className="p-1.5 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-emerald-600" />
                    <span>Matching Complaints ({searchResults.complaints.length})</span>
                  </div>
                  {searchResults.complaints.map((cRes) => {
                    const idx = flatItems.findIndex(
                      (fi) => fi.type === 'complaint' && (fi.data as ComplaintSearchResult).item.id === cRes.item.id
                    );
                    const isSelected = selectedIndex === idx;
                    const c = cRes.item;

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectItem({ type: 'complaint', data: cRes })}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected ? 'bg-emerald-50/90 text-emerald-950' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[11px] font-bold font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            {c.id}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900 truncate">
                                {c.title}
                              </span>
                              <StatusBadge status={c.status} />
                              <PriorityBadge priority={c.priority} />
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {c.location.landmark || c.location.address} • {c.department}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full Command Bar Footer Link */}
              <div className="p-2 bg-slate-50/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    openCommandBar(localQuery);
                  }}
                  className="w-full py-1 text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Open in Full Command Palette</span>
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
