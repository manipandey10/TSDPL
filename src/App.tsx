import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardHome from './pages/dashboard/DashboardHome';
import IdeaWorkspace from './pages/dashboard/IdeaWorkspace';
import ProjectsPage from './pages/dashboard/ProjectsPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import ActivityLogsPage from './pages/dashboard/ActivityLogsPage';
import WorkflowTrackerPage from './pages/dashboard/WorkflowTrackerPage';
import D0ValidationPage from './pages/dashboard/D0ValidationPage';
import D1ScoreMatrixPage from './pages/dashboard/D1ScoreMatrixPage';
import D2D4WorkflowPage from './pages/dashboard/D2D4WorkflowPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import SettingsPage from './pages/dashboard/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="ideas" element={<IdeaWorkspace />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="activity" element={<ActivityLogsPage />} />
            <Route path="workflow" element={<WorkflowTrackerPage />} />
            <Route path="d0-validation" element={<D0ValidationPage />} />
            <Route path="d1-score" element={<D1ScoreMatrixPage />} />
            <Route path="d2-d4" element={<D2D4WorkflowPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<LoginPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
