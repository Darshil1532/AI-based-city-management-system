import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ComplaintCategory, ComplaintStatus } from '../../types';
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const CitizenComplaintsList: React.FC = () => {
  const { complaints } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchesSearch =
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.location?.address && c.location.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' || c.category === selectedCategory;
      const matchesStatus =
        selectedStatus === 'all' || c.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [complaints, searchQuery, selectedCategory, selectedStatus]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Your Submitted Complaints
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Private citizen record. Only municipal issues registered by your citizen account are displayed here.
          </p>
        </div>

        <Link
          to="/citizen/report"
          className="inline-flex items-center gap-2 px-4.5 py-2.5 clay-btn clay-btn-primary text-xs font-bold rounded-2xl transition-all shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="clay-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-3.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID (e.g. SC1024), description, or street..."
            className="w-full pl-10 pr-4 py-2.5 text-xs clay-inset rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 text-xs clay-inset rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-semibold cursor-pointer"
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

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 text-xs clay-inset rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-semibold cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="clay-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
          <span className="font-bold text-slate-700 font-mono">
            Showing {filtered.length} of {complaints.length} complaints
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl clay-metric-icon bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-600">No complaints matched your search or filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="clay-btn clay-btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/track?id=${c.id}`)}
                className="p-4 sm:p-5 hover:bg-slate-100/50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-lg border border-indigo-100/80 shadow-2xs">
                      {c.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {c.title}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/90 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                      {c.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                    {c.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-xs">{c.location?.landmark || c.location?.address || 'Municipal Zone'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 font-semibold">
                      Dept: {c.department}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  <PriorityBadge priority={c.priority} size="sm" />
                  <StatusBadge status={c.status} size="sm" />
                  <span className="clay-btn clay-btn-secondary p-2 rounded-xl text-slate-500">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
