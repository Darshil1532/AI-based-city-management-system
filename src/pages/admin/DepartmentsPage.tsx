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
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Municipal Jurisdictions
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Municipal Departments & Field Squads
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Operational overview of city departments responsible for resolving citizen complaints and deploying ground technicians.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept: DepartmentInfo) => {
          const deptComplaints = complaints.filter((c) => c.department === dept.name);
          const active = deptComplaints.filter((c) => c.status !== 'resolved').length;
          const resolved = deptComplaints.filter((c) => c.status === 'resolved').length;

          return (
            <div
              key={dept.name}
              className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-2xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                    {deptComplaints.length} Assigned
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    {dept.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-mono">
                    <span>Score: <strong className="text-slate-900">{dept.efficiencyScore}%</strong></span>
                    <span>•</span>
                    <span>Avg SLA: <strong className="text-slate-900">{dept.avgResolutionHours}h</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500">Lead:</span>
                    <span className="font-semibold text-slate-800">{dept.head}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 truncate">{dept.contactEmail}</span>
                  </div>
                </div>

                {/* Workload */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Active Queue:</span>
                    <span className="font-bold text-amber-700 font-mono">{active} in progress</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Resolved:</span>
                    <span className="font-bold text-emerald-700 font-mono">{resolved} closed</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
