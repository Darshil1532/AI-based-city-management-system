import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Keyboard,
  X,
  Search,
  Command,
  CornerDownLeft,
  Navigation,
  CheckCircle,
  Sliders,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface ShortcutDefinition {
  keys: string[];
  description: string;
  category: 'Global & Search' | 'Navigation' | 'Triage & Actions' | 'Filter & Table';
  badge?: string;
  adminOnly?: boolean;
}

const SHORTCUTS: ShortcutDefinition[] = [
  // Global & Search
  {
    keys: ['/'],
    description: 'Focus global search input immediately',
    category: 'Global & Search',
    badge: 'Fast',
  },
  {
    keys: ['⌘', 'K'],
    description: 'Open & focus global search command input',
    category: 'Global & Search',
  },
  {
    keys: ['Esc'],
    description: 'Close active modals, dismiss dropdowns & clear focus',
    category: 'Global & Search',
    badge: 'Universal',
  },
  {
    keys: ['?'],
    description: 'Open / close this keyboard shortcuts cheat sheet',
    category: 'Global & Search',
  },
  {
    keys: ['p'],
    description: 'Quick toggle persona between Citizen & Admin suite',
    category: 'Global & Search',
    badge: 'Role Switch',
  },

  // Navigation
  {
    keys: ['g', 'd'],
    description: 'Go to Overview & Triage Dashboard',
    category: 'Navigation',
    badge: 'Jump',
  },
  {
    keys: ['g', 'c'],
    description: 'Go to Complaints Directory',
    category: 'Navigation',
  },
  {
    keys: ['g', 'm'],
    description: 'Go to Geographic GIS Map',
    category: 'Navigation',
  },
  {
    keys: ['g', 'h'],
    description: 'Go to DBSCAN Hotspot Detection',
    category: 'Navigation',
    adminOnly: true,
  },
  {
    keys: ['g', 'a'],
    description: 'Go to Analytics & KPIs',
    category: 'Navigation',
    adminOnly: true,
  },
  {
    keys: ['g', 'i'],
    description: 'Go to AI Recommendations & Insights',
    category: 'Navigation',
    adminOnly: true,
  },
  {
    keys: ['g', 's'],
    description: 'Go to System & Map Settings',
    category: 'Navigation',
    adminOnly: true,
  },
  {
    keys: ['g', 'r'],
    description: 'Go to Report Issue Intake Form (Citizen)',
    category: 'Navigation',
  },

  // Triage & Actions
  {
    keys: ['r'],
    description: 'Quick ratify AI recommendation on complaint detail',
    category: 'Triage & Actions',
    adminOnly: true,
    badge: 'Triage',
  },
  {
    keys: ['d'],
    description: 'Deploy field crew / Mark complaint In Progress',
    category: 'Triage & Actions',
    adminOnly: true,
    badge: 'Dispatch',
  },
  {
    keys: ['v'],
    description: 'Mark complaint verified & officially Resolved',
    category: 'Triage & Actions',
    adminOnly: true,
    badge: 'Resolve',
  },
  {
    keys: ['Backspace'],
    description: 'Return to complaints queue / dashboard',
    category: 'Triage & Actions',
  },

  // Filter & Table
  {
    keys: ['f'],
    description: 'Focus page filter search (on complaints table)',
    category: 'Filter & Table',
  },
  {
    keys: ['1'],
    description: 'Switch tab: All Complaints',
    category: 'Filter & Table',
  },
  {
    keys: ['2'],
    description: 'Switch tab: Pending Administrative Review',
    category: 'Filter & Table',
  },
  {
    keys: ['3'],
    description: 'Switch tab: High Priority Active Issues',
    category: 'Filter & Table',
  },
  {
    keys: ['4'],
    description: 'Switch tab: Resolved Complaints',
    category: 'Filter & Table',
  },
];

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, setIsShortcutsModalOpen, activePersona } = useApp();
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Handle Escape inside modal specifically
  useEffect(() => {
    if (!isShortcutsModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isShortcutsModalOpen, setIsShortcutsModalOpen]);

  // Reset filter when modal opens
  useEffect(() => {
    if (isShortcutsModalOpen) {
      setFilterQuery('');
      setSelectedCategory('all');
    }
  }, [isShortcutsModalOpen]);

  const categories = useMemo(() => {
    return ['all', 'Global & Search', 'Navigation', 'Triage & Actions', 'Filter & Table'];
  }, []);

  const filteredShortcuts = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    return SHORTCUTS.filter((s) => {
      const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
      const matchesQuery =
        !q ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.keys.some((k) => k.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [filterQuery, selectedCategory]);

  if (!isShortcutsModalOpen) return null;

  return (
    <div
      id="keyboard-shortcuts-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsShortcutsModalOpen(false);
        }
      }}
    >
      <div
        id="keyboard-shortcuts-modal"
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Keyboard className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Keyboard Shortcuts
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Power User Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Navigate the civic management suite rapidly without a mouse
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-shortcuts-modal"
            onClick={() => setIsShortcutsModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close shortcuts dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Category Pills */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search shortcuts (e.g. search, dashboard, ratify, esc)..."
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'All Shortcuts' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No shortcuts found matching &quot;{filterQuery}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredShortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-colors"
                >
                  <div className="flex flex-col pr-2">
                    <span className="text-xs font-semibold text-slate-800 leading-snug">
                      {shortcut.description}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {shortcut.category}
                      {shortcut.adminOnly && (
                        <span className="ml-1.5 text-amber-600 font-bold">• Admin</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {shortcut.keys.map((k, ki) => (
                      <React.Fragment key={ki}>
                        {ki > 0 && <span className="text-slate-400 text-[10px]">+</span>}
                        <kbd className="inline-flex items-center justify-center min-w-5 h-6 px-1.5 text-[11px] font-mono font-bold text-slate-700 bg-white rounded border border-slate-200 shadow-2xs">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
              <kbd className="font-bold">Esc</kbd> closes this dialog
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline font-mono text-[11px]">
              Press <kbd className="font-bold bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">/</kbd> anywhere to search
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsShortcutsModalOpen(false)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
