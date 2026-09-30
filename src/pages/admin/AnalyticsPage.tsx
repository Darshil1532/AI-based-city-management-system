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
      const pri = (c.finalPriority || c.aiPriority || c.priority || 'Low') as 'High' | 'Medium' | 'Low';
      if (counts[pri] !== undefined) {
        counts[pri]++;
      }
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
      const dist = c.location?.district || 'Downtown Commercial';
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
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-1.5 font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
          Municipal Intelligence
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          City Resolution Analytics & Civic Metrics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Aggregated quantitative operational metrics, category distributions, resolution throughput, and spatial clustering trends.
        </p>
      </div>

      {/* Summary metric banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="clay-card p-5 rounded-3xl">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Total Inflow</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{complaints.length}</span>
            <span className="text-xs text-slate-400 font-medium">reports</span>
          </div>
        </div>

        <div className="clay-card p-5 rounded-3xl">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Resolution Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700 font-mono tracking-tight">{resolutionRate}%</span>
            <span className="text-xs text-emerald-700 font-bold font-mono">completed</span>
          </div>
        </div>

        <div className="clay-card p-5 rounded-3xl">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Urgent Queue</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-700 font-mono tracking-tight">
              {complaints.filter((c) => c.priority === 'High' && c.status !== 'resolved').length}
            </span>
            <span className="text-xs text-rose-700 font-bold font-mono">active</span>
          </div>
        </div>

        <div className="clay-card p-5 rounded-3xl">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Active Clusters</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700 font-mono tracking-tight">{hotspots.length}</span>
            <span className="text-xs text-amber-700 font-bold font-mono">hotspots</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Category Bar & Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 clay-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl clay-badge clay-badge-blue flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Category Complaint Volume
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono clay-badge px-2.5 py-0.5 rounded-lg">By civic sector</span>
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
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.8)',
                  }}
                />
                <Bar dataKey="count" fill="#0f172a" radius={[6, 6, 0, 0]}>
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
        <div className="lg:col-span-5 clay-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl clay-badge clay-badge-emerald flex items-center justify-center">
                <PieIcon className="w-4 h-4 text-emerald-600" />
              </div>
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
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Priority Donut & Location Density */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Analytics (5 cols) */}
        <div className="lg:col-span-5 clay-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl clay-badge clay-badge-amber flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
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
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location & District Analytics (7 cols) */}
        <div className="lg:col-span-7 clay-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl clay-badge clay-badge-blue flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                District Complaint Density
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono clay-badge px-2.5 py-0.5 rounded-lg">Urban sectors</span>
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
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#0f172a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hotspots Analytics Summary Table */}
      <div className="clay-card rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-100/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl clay-badge clay-badge-rose flex items-center justify-center">
              <Flame className="w-4 h-4 text-rose-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Hotspot Density Index & Concentration Breakdown
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-5">Hotspot Name</th>
                <th className="py-3 px-5">District</th>
                <th className="py-3 px-5">Radius</th>
                <th className="py-3 px-5">Reports</th>
                <th className="py-3 px-5">Cluster Breakdown</th>
                <th className="py-3 px-5">Density Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotspots.map((hs) => (
                <tr key={hs.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-5 font-bold text-slate-900">{hs.name}</td>
                  <td className="py-3 px-5 text-slate-600">{hs.district || hs.locationName}</td>
                  <td className="py-3 px-5 text-slate-500 font-mono">{hs.radiusMeters}m</td>
                  <td className="py-3 px-5 font-mono font-bold text-slate-900">
                    {hs.complaintCount}
                  </td>
                  <td className="py-3 px-5">
                    <span className="text-slate-700 font-medium">
                      {hs.mainCategories
                        .map((mc) => `${mc.count} ${mc.category.split('/')[0]}`)
                        .join(', ')}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl ${
                        hs.riskLevel === 'High' || hs.riskLevel === 'Critical'
                          ? 'clay-badge clay-badge-rose'
                          : 'clay-badge clay-badge-amber'
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
