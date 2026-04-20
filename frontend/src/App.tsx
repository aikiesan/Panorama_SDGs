import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider, ToastContainer } from './components/common/Toast';
import RequireAuth from './components/auth/RequireAuth';
import Layout from './components/layout/Layout';

const LandingPage    = lazy(() => import('./pages/public/LandingPage'));
const Dashboard      = lazy(() => import('./pages/public/Dashboard'));
const SubmitProject  = lazy(() => import('./pages/public/SubmitProject'));
const AdminLogin     = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProjectReview  = lazy(() => import('./pages/admin/ProjectReview'));
const EditProject    = lazy(() => import('./pages/admin/EditProject'));

function App() {
  return (
    <ToastProvider>
      <ToastContainer />
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <Routes>
              <Route path="/" element={<Layout><LandingPage /></Layout>} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/submit" element={<Layout><SubmitProject /></Layout>} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <RequireAuth>
                    <AdminDashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/projects/:projectId"
                element={
                  <RequireAuth>
                    <ProjectReview />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/projects/:projectId/edit"
                element={
                  <RequireAuth>
                    <EditProject />
                  </RequireAuth>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
