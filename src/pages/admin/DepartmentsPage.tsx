import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DepartmentInfo } from '../../types';
import { Building2, Phone, Mail, Users, Wrench, ArrowRight } from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const { allComplaints, departments } = useApp();
  const complaints = allComplaints;
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-1.5 font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
          Municipal Jurisdictions
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Municipal Departments & Field Squads
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Operational overview of city departments responsible for resolving citizen complaints and deploying ground technicians.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept: DepartmentInfo) => {
          const deptComplaints = complaints.filter((c) => c.department === dept.name);
          const active = deptComplaints.filter((c) => c.status !== 'resolved').length;
          const resolved = deptComplaints.filter((c) => c.status === 'resolved').length;

          return (
            <div
              key={dept.name}
              className="clay-card rounded-3xl p-6 space-y-5 flex flex-col justify-between hover:scale-102 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-2xl clay-badge clay-badge-blue flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-3 py-1 rounded-xl clay-badge">
                    {deptComplaints.length} Assigned
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    {dept.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-mono">
                    <span className="clay-badge px-2 py-0.5 rounded-lg text-slate-700">Score: <strong className="text-slate-900">{dept.efficiencyScore}%</strong></span>
                    <span className="clay-badge px-2 py-0.5 rounded-lg text-slate-700">Avg SLA: <strong className="text-slate-900">{dept.avgResolutionHours}h</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100/80 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400 font-medium">Lead:</span>
                    <span className="font-bold text-slate-800">{dept.head}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400 font-medium">Email:</span>
                    <span className="font-bold text-slate-800 truncate">{dept.contactEmail}</span>
                  </div>
                </div>

                {/* Workload */}
                <div className="grid grid-cols-2 gap-2 text-xs clay-inset p-3.5 rounded-2xl bg-slate-50/70">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono font-bold">Active Queue:</span>
                    <span className="font-bold text-amber-700 font-mono mt-0.5 block">{active} active</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono font-bold">Resolved:</span>
                    <span className="font-bold text-emerald-700 font-mono mt-0.5 block">{resolved} closed</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="w-full py-3 px-4 clay-btn text-slate-800 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-102"
              >
                <span>Filter Complaints For Dept</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
