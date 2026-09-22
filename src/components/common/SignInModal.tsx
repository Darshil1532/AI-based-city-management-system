import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_CITIZEN, DEMO_ADMIN } from '../../context/AppContext';
import {
  Shield,
  User,
  CheckCircle2,
  X,
  Lock,
  ArrowRight,
  Sparkles,
  Building2,
  KeyRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SignInModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, activePersona, currentUser, loginAs } = useApp();
  const navigate = useNavigate();

  const [customCitizenName, setCustomCitizenName] = useState(DEMO_CITIZEN.name);
  const [customAdminName, setCustomAdminName] = useState(DEMO_ADMIN.name);
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'admin'>(activePersona);

  // Close on Escape key press
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLogin = (role: 'citizen' | 'admin') => {
    const name = role === 'citizen' ? customCitizenName : customAdminName;
    loginAs(role, name);
    setIsAuthModalOpen(false);
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/citizen/dashboard');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsAuthModalOpen(false);
        }
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Municipal Authentication & Persona Session
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Select or authenticate user persona
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400 bg-slate-100 rounded border border-slate-200">
              Esc
            </kbd>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Current active session status */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600">Currently Active:</span>
              <span className="font-bold text-slate-900 font-mono">
                {currentUser.name} ({activePersona === 'admin' ? 'Administrator' : 'Citizen'})
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {currentUser.badge}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Citizen Option Card */}
            <div
              onClick={() => setSelectedRole('citizen')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedRole === 'citizen'
                  ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  {activePersona === 'citizen' && (
                    <span className="text-[9px] font-mono uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                      Current
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900">Citizen Persona</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Report civic issues (potholes, trash, water), pick map locations, track resolution progress.
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">Citizen Name:</span>
                <input
                  type="text"
                  value={customCitizenName}
                  onChange={(e) => setCustomCitizenName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Admin Option Card */}
            <div
              onClick={() => setSelectedRole('admin')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedRole === 'admin'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  {activePersona === 'admin' && (
                    <span className="text-[9px] font-mono uppercase bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      Current
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900">Administrator Persona</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Review AI recommendations, override/ratify decisions, dispatch field crews, and sign off resolutions.
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">Admin Officer:</span>
                <input
                  type="text"
                  value={customAdminName}
                  onChange={(e) => setCustomAdminName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-700 font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Clearance: {selectedRole === 'admin' ? 'Level 4 (Supervisory)' : 'Resident Public Access'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleLogin(selectedRole)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Authenticate as {selectedRole === 'admin' ? 'Admin' : 'Citizen'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
