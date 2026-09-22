import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { AIDecisionDisclaimer } from '../../components/common/AIDecisionDisclaimer';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  MapPin,
  Flame,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { allComplaints, hotspots } = useApp();
  const complaints = allComplaints;

  // 1. Category Breakdown
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.split('/')[0].trim(),
      fullName: name,
      count,
    }));
  }, [complaints]);

  // 2. Status Breakdown
  const statusData = useMemo(() => {
    const counts = { submitted: 0, assigned: 0, in_progress: 0, resolved: 0 };
    complaints.forEach((c) => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });
    return [
      { name: 'Pending Review', value: counts.submitted, color: '#f59e0b' },
      { name: 'Assigned', value: counts.assigned, color: '#3b82f6' },
      { name: 'In Progress', value: counts.in_progress, color: '#0284c7' },
      { name: 'Resolved', value: counts.resolved, color: '#10b981' },
    ];
  }, [complaints]);

  // 3. Priority Breakdown
  const priorityData = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    complaints.forEach((c) => {
      counts[c.priority]++;
    });
    return [
      { name: 'High Priority', value: counts.High, color: '#ef4444' },
      { name: 'Medium Priority', value: counts.Medium, color: '#f59e0b' },
      { name: 'Low Priority', value: counts.Low, color: '#64748b' },
    ];
  }, [complaints]);

  // 4. District / Location Density
  const districtData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach((c) => {
      const dist = c.location.district || 'Downtown Commercial';
      counts[dist] = (counts[dist] || 0) + 1;
    });
    return Object.entries(counts).map(([district, count]) => ({
      district: district.replace('District', '').trim(),
      count,
    }));
  }, [complaints]);

  // 5. Resolution Rate KPI
  const resolutionRate = useMemo(() => {
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    return complaints.length ? Math.round((resolved / complaints.length) * 100) : 0;
  }, [complaints]);

  const CATEGORY_COLORS = ['#f97316', '#10b981', '#0284c7', '#eab308', '#ef4444', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Municipal Intelligence
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          City Resolution Analytics & Civic Metrics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Aggregated quantitative operational metrics, category distributions, resolution throughput, and spatial clustering trends.
        </p>
      </div>

      {/* Summary metric banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Total Inflow</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{complaints.length}</span>
            <span className="text-[11px] text-slate-400">reports</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Resolution Rate</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono tracking-tight">{resolutionRate}%</span>
            <span className="text-[11px] text-emerald-600/80 font-medium font-mono">completed</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Urgent Queue</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700 font-mono tracking-tight">
              {complaints.filter((c) => c.priority === 'High' && c.status !== 'resolved').length}
            </span>
            <span className="text-[11px] text-rose-600/80 font-medium font-mono">active</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Active Clusters</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700 font-mono tracking-tight">{hotspots.length}</span>
            <span className="text-[11px] text-amber-600/80 font-medium font-mono">hotspots</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Category Bar & Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Category Complaint Volume
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">By civic sector</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Status Lifecycle Analytics
              </h3>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Priority Donut & Location Density */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Analytics (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Priority Distribution
              </h3>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`pri-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location & District Analytics (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                District Complaint Density
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Urban sectors</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={districtData}
                margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis
                  dataKey="district"
                  type="category"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#0f172a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hotspots Analytics Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Hotspot Density Index & Concentration Breakdown
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-4">Hotspot Name</th>
                <th className="py-2.5 px-4">District</th>
                <th className="py-2.5 px-4">Radius</th>
                <th className="py-2.5 px-4">Reports</th>
                <th className="py-2.5 px-4">Cluster Breakdown</th>
                <th className="py-2.5 px-4">Density Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotspots.map((hs) => (
                <tr key={hs.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{hs.name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{hs.district || hs.locationName}</td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono">{hs.radiusMeters}m</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    {hs.complaintCount}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-slate-700">
                      {hs.mainCategories
                        .map((mc) => `${mc.count} ${mc.category.split('/')[0]}`)
                        .join(', ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        hs.riskLevel === 'High' || hs.riskLevel === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {hs.riskLevel} Density
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AIDecisionDisclaimer />
    </div>
  );
};
