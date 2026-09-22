import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { AIDecisionDisclaimer } from '../../components/common/AIDecisionDisclaimer';
import {
  ComplaintCategory,
  ComplaintStatus,
  PriorityLevel,
  Complaint,
} from '../../types';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  Shield,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building2,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  FileSpreadsheet,
  CheckSquare,
} from 'lucide-react';
import { BulkActionsBar } from '../../components/admin/BulkActionsBar';

export const AdminComplaintsPage: React.FC = () => {
  const { allComplaints } = useApp();
  const complaints = allComplaints;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state initialized from query params if available
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'high_priority' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'priority'>('date_desc');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bulk action selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // In-page keyboard shortcuts: '1'-'4' for tabs, 'f' for filter search
  useEffect(() => {
    const handleActionKey = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      const key = customEvent.detail?.key;
      if (!key) return;

      if (key === '1') setActiveTab('all');
      if (key === '2') setActiveTab('pending');
      if (key === '3') setActiveTab('high_priority');
      if (key === '4') setActiveTab('resolved');
      if (key === 'f') {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    const handleEscape = () => {
      if (selectedIds.length > 0) {
        setSelectedIds([]);
        return;
      }
      if (searchQuery) {
        handleSearchChange('');
      }
      searchInputRef.current?.blur();
    };

    window.addEventListener('app:action-key', handleActionKey);
    window.addEventListener('app:escape', handleEscape);
    return () => {
      window.removeEventListener('app:action-key', handleActionKey);
      window.removeEventListener('app:escape', handleEscape);
    };
  }, [searchQuery, selectedIds.length]);

  // Keep search in URL query params
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set('search', val);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: true });
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Search matching
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q) ||
        (c.citizenName && c.citizenName.toLowerCase().includes(q)) ||
        (c.department && c.department.toLowerCase().includes(q));

      // Category filter
      const currentCat = c.finalCategory || c.category;
      const matchesCat = selectedCategory === 'all' || currentCat === selectedCategory;

      // Priority filter
      const currentPri = c.finalPriority || c.aiPriority || c.priority;
      const matchesPri = selectedPriority === 'all' || currentPri === selectedPriority;

      // Status filter
      const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

      // Tab filter
      let matchesTab = true;
      if (activeTab === 'pending') {
        matchesTab = c.status === 'submitted';
      } else if (activeTab === 'high_priority') {
        matchesTab = currentPri === 'High' && c.status !== 'resolved';
      } else if (activeTab === 'resolved') {
        matchesTab = c.status === 'resolved';
      }

      return matchesSearch && matchesCat && matchesPri && matchesStatus && matchesTab;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'priority') {
        const order: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        const priA = a.finalPriority || a.priority || 'Low';
        const priB = b.finalPriority || b.priority || 'Low';
        return (order[priB] || 0) - (order[priA] || 0);
      }
      return 0;
    });
  }, [complaints, searchQuery, selectedCategory, selectedPriority, selectedStatus, activeTab, sortBy]);

  // Bulk action selection calculations & handlers
  const isAllSelected =
    filteredComplaints.length > 0 &&
    filteredComplaints.every((c) => selectedIds.includes(c.id));
  const isPartiallySelected =
    selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComplaints.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            <span>MUNICIPAL AUDIT REPOSITORY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Administrative Complaints Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full directory of civic issue submissions with citizen input, AI triage recommendations, and authorized administrator rulings.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/admin/map"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <span>View on GIS Map</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Quick Status Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Shortcut: Press 1"
        >
          <span>All Complaints ({complaints.length})</span>
          <kbd className={`text-[9px] font-mono font-bold px-1 rounded ${activeTab === 'all' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            1
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Shortcut: Press 2"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Review ({complaints.filter((c) => c.status === 'submitted').length})</span>
          <kbd className={`text-[9px] font-mono font-bold px-1 rounded ${activeTab === 'pending' ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            2
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('high_priority')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'high_priority'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Shortcut: Press 3"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>High Priority ({complaints.filter((c) => c.priority === 'High' && c.status !== 'resolved').length})</span>
          <kbd className={`text-[9px] font-mono font-bold px-1 rounded ${activeTab === 'high_priority' ? 'bg-rose-700 text-rose-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            3
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resolved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'resolved'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Shortcut: Press 4"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Resolved ({complaints.filter((c) => c.status === 'resolved').length})</span>
          <kbd className={`text-[9px] font-mono font-bold px-1 rounded ${activeTab === 'resolved' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            4
          </kbd>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="page-search-input"
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search complaints... (press 'f' to focus)"
            className="w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200/90 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer font-mono"
            >
              Clear
            </button>
          ) : (
            <kbd className="hidden md:inline-flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 h-4 px-1 text-[9px] font-mono text-slate-400 bg-white rounded border border-slate-200 pointer-events-none">
              f
            </kbd>
          )}
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200/90 rounded-lg focus:outline-none text-slate-700"
        >
          <option value="all">All Categories</option>
          <option value="Pothole / Road">Pothole / Road</option>
          <option value="Garbage / Waste">Garbage / Waste</option>
          <option value="Water Leakage">Water Leakage</option>
          <option value="Streetlight">Streetlight</option>
          <option value="Traffic">Traffic</option>
          <option value="Infrastructure">Infrastructure</option>
        </select>

        {/* Priority filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          aria-label="Filter by priority"
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200/90 rounded-lg focus:outline-none text-slate-700"
        >
          <option value="all">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filter by status"
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200/90 rounded-lg focus:outline-none text-slate-700"
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          aria-label="Sort ledger"
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200/90 rounded-lg focus:outline-none text-slate-700 font-medium"
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="priority">Priority (High to Low)</option>
        </select>
      </div>

      {/* Decision-Support Banner */}
      <div className="bg-blue-50/60 border border-blue-200/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">AI-Assisted Decision Support Active:</span>
          <p className="text-blue-800 text-[11px] leading-relaxed">
            Every record displays both the automated AI model classification/priority recommendations and the administrator's authorized determinations. AI recommendations require human administrative approval before field dispatch.
          </p>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all complaints"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Issue / Citizen Narrative</th>
                <th className="py-3 px-4">Citizen Input</th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1 text-blue-700">
                    <Sparkles className="w-3 h-3" />
                    AI Recommendation
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1 text-slate-900">
                    <Shield className="w-3 h-3" />
                    Admin Status
                  </span>
                </th>
                <th className="py-3 px-4">Department / Officer</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                    <Filter className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No matching municipal complaints found</p>
                    <p className="text-[11px] text-slate-400">
                      Try clearing search queries or relaxing category and priority filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-50/70 hover:bg-blue-50/90'
                          : 'hover:bg-slate-50/70'
                      }`}
                      onClick={() => navigate(`/admin/complaint/${c.id}`)}
                    >
                      {/* Checkbox column */}
                      <td
                        className="py-3.5 px-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select complaint ${c.id}`}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(c.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          )}
                          <span>{c.id}</span>
                        </div>
                      </td>

                      {/* Title & Address */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {c.location.address}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Citizen Input */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium text-[11px]">{c.category}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Severity: {c.severity}</div>
                      </td>

                      {/* AI Recommendation */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={c.aiPriority} size="sm" isAI={true} />
                          <span className="text-[10px] font-mono text-blue-600 font-semibold">
                            {c.aiConfidence ? `${Math.round(c.aiConfidence * 100)}%` : '88%'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono truncate max-w-[140px]">
                          Sug. Dept: {c.aiDepartment ? c.aiDepartment.replace(' Department', '') : 'PWD'}
                        </div>
                      </td>

                      {/* Admin Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={c.status} size="sm" />
                        <div className="mt-1">
                          <PriorityBadge priority={c.finalPriority || (c.reviewDecision === 'pending' ? undefined : c.priority)} size="sm" />
                        </div>
                      </td>

                      {/* Department & Officer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium text-[11px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[140px]">{c.assignedDepartment || c.department || 'Unassigned'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]">
                          {c.assignedOfficer || (c.reviewDecision === 'pending' ? 'Pending human assignment' : 'Pending dispatch')}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/complaint/${c.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Ledger Footer */}
        <div className="py-3 px-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>Displaying {filteredComplaints.length} of {complaints.length} municipal records</span>
            {selectedIds.length > 0 && (
              <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {selectedIds.length} selected for bulk actions
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              AI Guided
            </span>
            <span className="flex items-center gap-1 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              Admin Authority
            </span>
          </div>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        allComplaints={complaints}
        totalVisibleCount={filteredComplaints.length}
        onSelectAllVisible={handleToggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
      />

      <AIDecisionDisclaimer />
    </div>
  );
};
