import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { currentUser, loginAs } = useApp();
  const navigate = useNavigate();

  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Access Denied • Administrator Clearance Required
            </h2>
            <p className="text-xs text-rose-700 font-medium">
              Role-Based Access Control (RBAC) Enforcement
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            You are currently signed in as{' '}
            <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.title}).
            Municipal operations, AI decision ratification, complaint dispatching, and department work
            order controls are restricted to verified municipal administrators.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-1 font-mono text-slate-600">
            <div><strong>Required Role:</strong> admin</div>
            <div><strong>Your Current Role:</strong> {currentUser.role}</div>
            <div><strong>Active Account ID:</strong> {currentUser.id}</div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => loginAs('admin')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Sign In as Administrator (Demo Admin)
            </button>

            <button
              type="button"
              onClick={() => navigate('/citizen/dashboard')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Citizen Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
