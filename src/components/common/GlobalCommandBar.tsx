import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import {
  Search,
  Building2,
  FileText,
  X,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { ComplaintSearchResult, DepartmentSearchResult } from '../../types';

interface GlobalCommandBarProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialQuery?: string;
  onSelectDepartmentForFilter?: (deptName: string) => void;
}

export const GlobalCommandBar: React.FC<GlobalCommandBarProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialQuery: propInitialQuery,
  onSelectDepartmentForFilter,
}) => {
  const {
    isCommandBarOpen,
    closeCommandBar,
    commandBarInitialQuery,
    searchDatabase,
    activePersona,
    departments,
    allComplaints,
  } = useApp();

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Controlled or context state
  const isOpen = propIsOpen !== undefined ? propIsOpen : isCommandBarOpen;
  const handleClose = propOnClose || closeCommandBar;

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'complaints' | 'departments'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      const initQ = propInitialQuery !== undefined ? propInitialQuery : commandBarInitialQuery;
      setQuery(initQ || '');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, propInitialQuery, commandBarInitialQuery]);

  // Query results from the database service
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        query: '',
        complaints: [],
        departments: [],
        totalMatches: 0,
      };
    }
    return searchDatabase(query, { type: activeTab, limit: 12 });
  }, [query, activeTab, searchDatabase]);

  // Combine items for keyboard navigation
  const flatItems = useMemo(() => {
    const items: Array<{
      type: 'complaint' | 'department';
      data: ComplaintSearchResult | DepartmentSearchResult;
    }> = [];

    if (activeTab === 'all' || activeTab === 'departments') {
      searchResults.departments.forEach((d) => items.push({ type: 'department', data: d }));
    }
    if (activeTab === 'all' || activeTab === 'complaints') {
      searchResults.complaints.forEach((c) => items.push({ type: 'complaint', data: c }));
    }
    return items;
  }, [searchResults, activeTab]);

  // Keep selected index within range
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTab]);

  // Handle keyboard events inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
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

    if (e.key === 'Tab') {
      e.preventDefault();
      if (activeTab === 'all') setActiveTab('complaints');
      else if (activeTab === 'complaints') setActiveTab('departments');
      else setActiveTab('all');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems.length > 0 && flatItems[selectedIndex]) {
        handleSelectItem(flatItems[selectedIndex]);
      } else if (query.trim()) {
        // Fallback search navigation
        if (activePersona === 'admin') {
          navigate(`/admin/complaints?search=${encodeURIComponent(query.trim())}`);
        } else {
          navigate(`/citizen/my-complaints?search=${encodeURIComponent(query.trim())}`);
        }
        handleClose();
      }
    }
  };

  const handleSelectItem = (item: {
    type: 'complaint' | 'department';
    data: ComplaintSearchResult | DepartmentSearchResult;
  }) => {
    handleClose();
    if (item.type === 'complaint') {
      const complaint = (item.data as ComplaintSearchResult).item;
      if (activePersona === 'admin') {
        navigate(`/admin/complaint/${complaint.id}`);
      } else {
        navigate(`/track?id=${complaint.id}`);
      }
    } else {
      const dept = (item.data as DepartmentSearchResult).item;
      if (onSelectDepartmentForFilter) {
        onSelectDepartmentForFilter(dept.name);
      } else {
        navigate('/admin/departments');
      }
    }
  };

  // Preset suggestions when query is empty
  const defaultDepartments = useMemo(() => departments.slice(0, 4), [departments]);
  const defaultRecentComplaints = useMemo(() => allComplaints.slice(0, 4), [allComplaints]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Global Command & Search Bar"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Command Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <Search className="w-4 h-4 text-slate-700" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search complaints (ID, address, keyword) or municipal departments..."
            className="flex-1 bg-transparent border-none outline-hidden text-sm sm:text-base text-slate-900 placeholder:text-slate-400 font-medium"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 rounded border border-slate-200">
              ESC
            </kbd>
          </div>
        </div>

        {/* Filter Category Tabs & Quick Toggles */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs overflow-x-auto gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mr-1 hidden sm:inline">
              Filter:
            </span>
            {[
              { id: 'all', label: 'All Results' },
              { id: 'complaints', label: 'Complaints', count: searchResults.complaints.length },
              { id: 'departments', label: 'Departments', count: searchResults.departments.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'all' | 'complaints' | 'departments')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                {query.trim() && tab.count !== undefined && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {query.trim() && (
            <span className="text-[11px] text-slate-500 font-mono shrink-0">
              {searchResults.totalMatches} database {searchResults.totalMatches === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>

        {/* Search Results List Container */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-4 divide-y divide-slate-100">
          {/* Active Search Results */}
          {query.trim() ? (
            flatItems.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">No database matches found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No complaints or departments matched &quot;{query}&quot;. Try searching with an ID (e.g. SC1024), category (Pothole, Streetlight), or department name (Sanitation, Public Works).
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {/* Department Matches */}
                {(activeTab === 'all' || activeTab === 'departments') &&
                  searchResults.departments.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          Municipal Departments ({searchResults.departments.length})
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Direct dispatch & jurisdictions</span>
                      </div>

                      <div className="space-y-1">
                        {searchResults.departments.map((deptRes) => {
                          const itemIndex = flatItems.findIndex(
                            (fi) => fi.type === 'department' && (fi.data as DepartmentSearchResult).item.id === deptRes.item.id
                          );
                          const isSelected = selectedIndex === itemIndex;
                          const dept = deptRes.item;

                          return (
                            <div
                              key={dept.id}
                              onClick={() => handleSelectItem({ type: 'department', data: deptRes })}
                              onMouseEnter={() => setSelectedIndex(itemIndex)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                                  : 'bg-white hover:bg-slate-50 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                                  <Building2 className="w-4 h-4 text-blue-300" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                      {dept.name}
                                    </h4>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      {dept.activeComplaints} Active Cases
                                    </span>
                                    {deptRes.matchedFields.includes('name') ? (
                                      <span className="text-[9px] font-mono px-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Name Match
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-mono px-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                        {deptRes.matchedFields[0]}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 truncate mt-0.5">
                                    Head: <strong className="text-slate-700">{dept.head}</strong> • SLA: {dept.avgResolutionHours}h • Efficiency: {dept.efficiencyScore}%
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClose();
                                    if (onSelectDepartmentForFilter) {
                                      onSelectDepartmentForFilter(dept.name);
                                    } else {
                                      navigate(`/admin/complaints?search=${encodeURIComponent(dept.name)}`);
                                    }
                                  }}
                                  className="px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100/70 rounded-lg transition-colors hidden sm:inline-flex items-center gap-1 cursor-pointer"
                                  title="Filter complaints for this department"
                                >
                                  <Filter className="w-3 h-3" />
                                  <span>Filter</span>
                                </button>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Complaint Matches */}
                {(activeTab === 'all' || activeTab === 'complaints') &&
                  searchResults.complaints.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          Complaints ({searchResults.complaints.length})
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Press Enter to inspect</span>
                      </div>

                      <div className="space-y-1">
                        {searchResults.complaints.map((cRes) => {
                          const itemIndex = flatItems.findIndex(
                            (fi) => fi.type === 'complaint' && (fi.data as ComplaintSearchResult).item.id === cRes.item.id
                          );
                          const isSelected = selectedIndex === itemIndex;
                          const c = cRes.item;

                          return (
                            <div
                              key={c.id}
                              onClick={() => handleSelectItem({ type: 'complaint', data: cRes })}
                              onMouseEnter={() => setSelectedIndex(itemIndex)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                                  : 'bg-white hover:bg-slate-50 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 border border-slate-200 mt-0.5">
                                  {c.id}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                      {c.title}
                                    </h4>
                                    <StatusBadge status={c.status} />
                                    <PriorityBadge priority={c.priority} />
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                                    <span className="flex items-center gap-1 text-slate-600 truncate">
                                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                      {c.location.landmark || c.location.address}
                                    </span>
                                    <span>•</span>
                                    <span className="text-slate-600 font-medium truncate">
                                      {c.department || c.assignedDepartment}
                                    </span>
                                    {c.citizenName && (
                                      <>
                                        <span>•</span>
                                        <span className="text-slate-500">Citizen: {c.citizenName}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            )
          ) : (
            /* Zero-State: Quick Suggestions & Database Browsing */
            <div className="space-y-4 pt-1">
              {/* Quick Department Shortcuts */}
              <div className="space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                  <span>Municipal Departments</span>
                  <span className="text-slate-400 font-normal">Click to search jurisdiction</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {defaultDepartments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setQuery(dept.name)}
                      className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                            {dept.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {dept.activeComplaints} cases • {dept.head.split('(')[0]}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Quick Searches */}
              <div className="space-y-1.5 pt-2">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Popular Queries
                </div>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {[
                    { label: 'Pothole repairs', q: 'Pothole' },
                    { label: 'Water pipe leakages', q: 'Water Leakage' },
                    { label: 'Garbage dump overflow', q: 'Garbage' },
                    { label: 'Streetlight outages', q: 'Streetlight' },
                    { label: 'High Urgency Cases', q: 'High' },
                    { label: 'Pending Review', q: 'submitted' },
                    { label: 'Sanitation Dept', q: 'Sanitation' },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setQuery(s.q)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Cases */}
              <div className="space-y-1.5 pt-2">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Recent Complaints in Database
                </div>
                <div className="space-y-1">
                  {defaultRecentComplaints.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        handleClose();
                        if (activePersona === 'admin') {
                          navigate(`/admin/complaint/${c.id}`);
                        } else {
                          navigate(`/track?id=${c.id}`);
                        }
                      }}
                      className="p-2.5 rounded-xl border border-slate-200/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                          {c.id}
                        </span>
                        <span className="text-xs font-medium text-slate-800 truncate">
                          {c.title}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 hidden sm:inline">
                        {c.department}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Command Bar Footer with Shortcuts Help */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs font-bold text-slate-700">
                ↑↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs font-bold text-slate-700">
                ↵
              </kbd>
              <span>select</span>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs font-bold text-slate-700">
                tab
              </kbd>
              <span>switch filter</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Database Search</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
