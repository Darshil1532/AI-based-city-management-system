import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { AIDecisionDisclaimer } from '../../components/common/AIDecisionDisclaimer';
import { DashboardCommandBar } from '../../components/admin/DashboardCommandBar';
import {
  Complaint,
  ComplaintCategory,
  PriorityLevel,
  ComplaintStatus,
  DepartmentName,
} from '../../types';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Lightbulb,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { allComplaints, hotspots, aiInsights } = useApp();
  const complaints = allComplaints;
  const navigate = useNavigate();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<'createdAt' | 'priority' | 'id'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // KPIs
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'submitted').length;
  const inProgress = complaints.filter((c) => c.status === 'in_progress' || c.status === 'assigned').length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const highPriority = complaints.filter((c) => c.priority === 'High' && c.status !== 'resolved').length;

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.department && c.department.toLowerCase().includes(q)) ||
        c.location.address.toLowerCase().includes(q) ||
        (c.location.landmark && c.location.landmark.toLowerCase().includes(q)) ||
        (c.citizenName && c.citizenName.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
      const matchesPri = priorityFilter === 'all' || c.priority === priorityFilter;
      const matchesSta = statusFilter === 'all' || c.status === statusFilter;
      const matchesDept = departmentFilter === 'all' || c.department === departmentFilter;

      let matchesDate = true;
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        matchesDate = c.createdAt.startsWith(today);
      } else if (dateFilter === '7days') {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        matchesDate = c.createdAt >= cutoff;
      }

      return matchesQuery && matchesCat && matchesPri && matchesSta && matchesDept && matchesDate;
    });
  }, [complaints, searchQuery, categoryFilter, priorityFilter, statusFilter, departmentFilter, dateFilter]);

  // Sorted complaints
  const sortedComplaints = useMemo(() => {
    return [...filteredComplaints].sort((a, b) => {
      if (sortField === 'createdAt') {
        return sortOrder === 'desc'
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortField === 'priority') {
        const score = { High: 3, Medium: 2, Low: 1 };
        return sortOrder === 'desc'
          ? score[b.priority] - score[a.priority]
          : score[a.priority] - score[b.priority];
      }
      if (sortField === 'id') {
        return sortOrder === 'desc' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
      }
      return 0;
    });
  }, [filteredComplaints, sortField, sortOrder]);

  // Paginated complaints
  const totalPages = Math.max(1, Math.ceil(sortedComplaints.length / itemsPerPage));
  const paginatedComplaints = sortedComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (field: 'createdAt' | 'priority' | 'id') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Municipal Control Room
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50/90 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Decision Support Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Incident Triage & Municipal Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review incoming citizen reports, validate AI classification recommendations, and dispatch department work orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/hotspots"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-slate-700 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Hotspots</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/60">
              {hotspots.length}
            </span>
          </Link>
          <Link
            to="/admin/insights"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-slate-700 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
            <span>AI Insights</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60">
              {aiInsights.filter((i) => i.status === 'new').length}
            </span>
          </Link>
        </div>
      </div>

      {/* KPI Cards: Total, Pending, In Progress, Resolved, High Priority */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Complaints */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Total Intake</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{total}</span>
            <span className="text-[11px] text-slate-400">cases</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 font-mono">Needs Triage</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-amber-600">{pending}</span>
            <span className="text-[11px] text-amber-600/80 font-medium">pending</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 font-mono">In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-sky-600">{inProgress}</span>
            <span className="text-[11px] text-sky-600/80 font-medium">dispatched</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-mono">Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">{resolved}</span>
            <span className="text-[11px] text-emerald-600/80 font-medium">closed</span>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 font-mono">High Urgency</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-rose-600">{highPriority}</span>
            <span className="text-[11px] text-rose-600/80 font-medium">critical</span>
          </div>
        </div>
      </div>

      {/* Decision-Support System Banner */}
      <AIDecisionDisclaimer />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 space-y-3.5">
        {/* Quick Status Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {[
              { id: 'all', label: 'All Cases', count: total },
              { id: 'submitted', label: 'Needs Triage', count: pending },
              { id: 'assigned', label: 'Assigned', count: complaints.filter(c => c.status === 'assigned').length },
              { id: 'in_progress', label: 'In Progress', count: complaints.filter(c => c.status === 'in_progress').length },
              { id: 'resolved', label: 'Resolved', count: resolved },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {(searchQuery ||
            categoryFilter !== 'all' ||
            priorityFilter !== 'all' ||
            statusFilter !== 'all' ||
            departmentFilter !== 'all' ||
            dateFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setPriorityFilter('all');
                setStatusFilter('all');
                setDepartmentFilter('all');
                setDateFilter('all');
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Global Database Search & Command Bar directly on Dashboard */}
        <DashboardCommandBar
          currentSearchQuery={searchQuery}
          onSearchChange={(newQ) => {
            setSearchQuery(newQ);
            setCurrentPage(1);
          }}
          activeDepartmentFilter={departmentFilter}
          onDepartmentSelect={(deptName) => {
            setDepartmentFilter(deptName);
            setCurrentPage(1);
          }}
          onComplaintSelect={(complaintId) => {
            navigate(`/admin/complaint/${complaintId}`);
          }}
        />

        {/* Secondary Filter Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Categories</option>
              <option value="Pothole / Road">Pothole / Road</option>
              <option value="Garbage / Waste">Garbage / Waste</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Traffic">Traffic</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
              Priority Urgency
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Urgency</option>
              <option value="Medium">Medium Urgency</option>
              <option value="Low">Low Urgency</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 truncate"
            >
              <option value="all">All Departments</option>
              <option value="Public Works Department">Public Works</option>
              <option value="Sanitation Department">Sanitation</option>
              <option value="Water Supply Department">Water Supply</option>
              <option value="Electrical Department">Electrical</option>
              <option value="Traffic & Transit Department">Traffic & Transit</option>
              <option value="Urban Infrastructure Division">Urban Infrastructure</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
              Intake Timeframe
            </label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Time</option>
              <option value="today">Today Only</option>
              <option value="7days">Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaint Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Incident Records ({sortedComplaints.length})
            </h2>
            <span className="hidden sm:inline-block text-[11px] text-slate-400">
              Select any incident to inspect AI confidence scores & dispatch crew
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th
                  onClick={() => toggleSort('id')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[200px]">Issue & Description</th>
                <th className="py-3 px-4">Category</th>
                <th
                  onClick={() => toggleSort('priority')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Priority</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[150px]">Location</th>
                <th className="py-3 px-4 min-w-[150px]">Department</th>
                <th className="py-3 px-4">Status</th>
                <th
                  onClick={() => toggleSort('createdAt')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Intake</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No complaints match the specified filters.
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/complaint/${c.id}`)}
                    className="hover:bg-slate-50/90 cursor-pointer transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
                        {c.id}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {c.title}
                      </span>
                      <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {c.description}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md text-[11px] border border-slate-200/60">
                        {c.category}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} size="sm" isAI={true} />
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 max-w-[180px]">
                      <span className="font-medium text-slate-800 line-clamp-1 text-[11px]">
                        {c.location.landmark || c.location.address}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                        {c.location.district || c.location.address}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 max-w-[180px]">
                      <span className="font-medium text-slate-700 line-clamp-1 text-[11px]">
                        {c.department}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-[11px] font-mono">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/complaint/${c.id}`);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 transition-all shadow-2xs cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedComplaints.length)} of{' '}
              {sortedComplaints.length} records
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-mono font-semibold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
