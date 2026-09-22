import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export interface ShortcutFeedback {
  key: string;
  message: string;
  id: number;
}

export const useGlobalKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    activePersona,
    loginAs,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
  } = useApp();

  const [feedback, setFeedback] = useState<ShortcutFeedback | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const pendingSequenceRef = useRef<string | null>(null);
  const sequenceTimeoutRef = useRef<number | null>(null);

  const showFeedback = (key: string, message: string) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setFeedback({ key, message, id: Date.now() });
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 1800);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      // 1. ESCAPE: Always handled, even if typing inside an input
      if (e.key === 'Escape') {
        let handled = false;

        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          handled = true;
        }

        if (isAuthModalOpen) {
          setIsAuthModalOpen(false);
          handled = true;
        }

        if (isInput) {
          (activeEl as HTMLElement).blur();
          handled = true;
        }

        // Notify any page-specific components listening for Escape
        window.dispatchEvent(new CustomEvent('app:escape'));

        if (handled) {
          showFeedback('Esc', 'Closed modals & cleared focus');
        }
        return;
      }

      // 2. SEARCH FOCUS: '/' or 'Cmd+K' / 'Ctrl+K'
      const isSearchShortcut =
        (!isInput && e.key === '/') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k');

      if (isSearchShortcut) {
        e.preventDefault();
        e.stopPropagation();

        // Priority 1: Page specific search input if present (e.g., in complaints table)
        // Priority 2: Global header search input
        const pageSearch = document.getElementById('page-search-input') as HTMLInputElement | null;
        const globalSearch = document.getElementById('global-search-input') as HTMLInputElement | null;
        const targetInput = globalSearch || pageSearch;

        if (targetInput) {
          targetInput.focus();
          targetInput.select();
          showFeedback(e.key === '/' ? '/' : '⌘K', 'Search focused');
        }
        return;
      }

      // If typing in any input field, do not process single-key navigation shortcuts
      if (isInput) {
        return;
      }

      // Don't intercept if holding modifier keys (except Shift for '?')
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      // 3. SHORTCUTS CHEAT SHEET: '?'
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsModalOpen(!isShortcutsModalOpen);
        showFeedback('?', isShortcutsModalOpen ? 'Shortcuts closed' : 'Shortcuts opened');
        return;
      }

      // 4. PERSONA TOGGLE: 'p'
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        const nextPersona = activePersona === 'admin' ? 'citizen' : 'admin';
        loginAs(nextPersona);
        if (nextPersona === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/citizen/dashboard');
        }
        showFeedback('P', `Role switched to ${nextPersona.toUpperCase()}`);
        return;
      }

      // 5. TWO-KEY SEQUENCES: 'g' then <key>
      if (e.key === 'g' || e.key === 'G') {
        pendingSequenceRef.current = 'g';
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
        }
        sequenceTimeoutRef.current = window.setTimeout(() => {
          pendingSequenceRef.current = null;
        }, 1200);
        showFeedback('g...', 'Press next key (d, c, m, h, a, i, s, r)');
        return;
      }

      if (pendingSequenceRef.current === 'g') {
        const nextKey = e.key.toLowerCase();
        pendingSequenceRef.current = null;
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
        }

        switch (nextKey) {
          case 'd':
            e.preventDefault();
            if (activePersona === 'admin') {
              navigate('/admin/dashboard');
              showFeedback('g + d', 'Navigating to Admin Dashboard');
            } else {
              navigate('/citizen/dashboard');
              showFeedback('g + d', 'Navigating to Citizen Dashboard');
            }
            return;

          case 'c':
            e.preventDefault();
            if (activePersona === 'admin') {
              navigate('/admin/complaints');
              showFeedback('g + c', 'Navigating to All Complaints');
            } else {
              navigate('/citizen/my-complaints');
              showFeedback('g + c', 'Navigating to My Complaints');
            }
            return;

          case 'm':
            e.preventDefault();
            if (activePersona === 'admin') {
              navigate('/admin/map');
              showFeedback('g + m', 'Navigating to GIS Map');
            } else {
              navigate('/citizen/map');
              showFeedback('g + m', 'Navigating to Civic Issue Map');
            }
            return;

          case 'h':
            e.preventDefault();
            navigate('/admin/hotspots');
            showFeedback('g + h', 'Navigating to Hotspot Detection');
            return;

          case 'a':
            e.preventDefault();
            navigate('/admin/analytics');
            showFeedback('g + a', 'Navigating to Analytics');
            return;

          case 'i':
            e.preventDefault();
            navigate('/admin/insights');
            showFeedback('g + i', 'Navigating to AI Insights');
            return;

          case 's':
            e.preventDefault();
            navigate('/admin/settings');
            showFeedback('g + s', 'Navigating to System Settings');
            return;

          case 'r':
            e.preventDefault();
            navigate('/citizen/report');
            showFeedback('g + r', 'Navigating to Report Issue');
            return;

          default:
            break;
        }
      }

      // 6. Broadcast other unhandled key events for active page context (e.g., 'r', 'd', 'v', '1'-'4')
      window.dispatchEvent(new CustomEvent('app:action-key', { detail: { key: e.key.toLowerCase() } }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
    };
  }, [
    activePersona,
    isAuthModalOpen,
    isShortcutsModalOpen,
    loginAs,
    navigate,
    setIsAuthModalOpen,
    setIsShortcutsModalOpen,
  ]);

  return { feedback };
};
