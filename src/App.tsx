import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { SignInModal } from './components/common/SignInModal';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { GlobalCommandBar } from './components/common/GlobalCommandBar';
import { AICityAssistantModal } from './components/ai/AICityAssistantModal';
import { useGlobalKeyboardShortcuts } from './utils/useGlobalKeyboardShortcuts';
import { AdminRouteGuard } from './components/common/AdminRouteGuard';

// Citizen Pages
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { ReportIssuePage } from './pages/citizen/ReportIssuePage';
import { ComplaintConfirmationPage } from './pages/citizen/ComplaintConfirmationPage';
import { TrackComplaintPage } from './pages/citizen/TrackComplaintPage';
import { CitizenComplaintsList } from './pages/citizen/CitizenComplaintsList';
import { CitizenMapPage } from './pages/citizen/CitizenMapPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminComplaintsPage } from './pages/admin/AdminComplaintsPage';
import { AdminComplaintDetail } from './pages/admin/AdminComplaintDetail';
import { AdminMapPage } from './pages/admin/AdminMapPage';
import { HotspotDetectionPage } from './pages/admin/HotspotDetectionPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { AIInsightsPage } from './pages/admin/AIInsightsPage';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Layout Controller Component
const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { feedback } = useGlobalKeyboardShortcuts();

  useEffect(() => {
    const handleEscape = () => {
      setMobileMenuOpen(false);
    };
    window.addEventListener('app:escape', handleEscape);
    return () => window.removeEventListener('app:escape', handleEscape);
  }, []);

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Global Sign In / Persona Switcher Modal */}
      <SignInModal />

      {/* Global Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal />

      {/* Global Command Bar & Database Search Palette */}
      <GlobalCommandBar />

      {/* Floating AI Civic Assistant (Voice & Chat with SmartCity AI Engine) */}
      <AICityAssistantModal />

      {/* Top Bar Header */}
      <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Main Workspace Body with Sidebar */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Content View Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-full min-w-0">
          <Routes>
            {/* Root redirects to Citizen Home */}
            <Route path="/" element={<Navigate to="/citizen/dashboard" replace />} />

            {/* Citizen Routes */}
            <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
            <Route path="/citizen/report" element={<ReportIssuePage />} />
            <Route path="/confirmation/:id" element={<ComplaintConfirmationPage />} />
            <Route path="/track" element={<TrackComplaintPage />} />
            <Route path="/citizen/track" element={<Navigate to="/track" replace />} />
            <Route path="/citizen/my-complaints" element={<CitizenComplaintsList />} />
            <Route path="/my-complaints" element={<Navigate to="/citizen/my-complaints" replace />} />
            <Route path="/citizen/map" element={<CitizenMapPage />} />

            {/* Protected Admin Routes (Enforced by AdminRouteGuard) */}
            <Route
              path="/admin"
              element={
                <AdminRouteGuard>
                  <Navigate to="/admin/dashboard" replace />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRouteGuard>
                  <AdminDashboard />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <AdminRouteGuard>
                  <AdminComplaintsPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/complaint"
              element={
                <AdminRouteGuard>
                  <Navigate to="/admin/complaints" replace />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/complaint/:id"
              element={
                <AdminRouteGuard>
                  <AdminComplaintDetail />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/map"
              element={
                <AdminRouteGuard>
                  <AdminMapPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/hotspots"
              element={
                <AdminRouteGuard>
                  <HotspotDetectionPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRouteGuard>
                  <AnalyticsPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/insights"
              element={
                <AdminRouteGuard>
                  <AIInsightsPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <AdminRouteGuard>
                  <DepartmentsPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRouteGuard>
                  <AdminSettingsPage />
                </AdminRouteGuard>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/citizen/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppLayout />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
