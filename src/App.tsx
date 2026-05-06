import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';
import ToastContainer from './components/Toast';

// Pages
import LandingPage from './pages/LandingPage';
import AuthLayout from './pages/auth/AuthLayout';
import SignUpPage from './pages/auth/SignUpPage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import MentorOnboardingPage from './pages/onboarding/MentorOnboardingPage';
import MenteeOnboardingPage from './pages/onboarding/MenteeOnboardingPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import ExploreMentorsPage from './pages/explore/ExploreMentorsPage';
import MentorProfilePage from './pages/mentor/MentorProfilePage';
import MenteeProfilePage from './pages/mentee/MenteeProfilePage';
import GoalsPage from './pages/goals/GoalsPage';
import MessagesPage from './pages/messages/MessagesPage';
import EventsPage from './pages/events/EventsPage';
import RatingsPage from './pages/ratings/RatingsPage';
import SettingsPage from './pages/settings/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <PublicOnlyRoute>
              <LandingPage />
            </PublicOnlyRoute>
          } />

          {/* Auth routes */}
          <Route element={
            <PublicOnlyRoute>
              <AuthLayout />
            </PublicOnlyRoute>
          }>
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* Auth callback (no guard — needs to process the redirect) */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Onboarding (authenticated but no onboarding requirement) */}
          <Route path="/onboarding/mentor" element={
            <ProtectedRoute requireOnboarding={false}>
              <MentorOnboardingPage />
            </ProtectedRoute>
          } />
          <Route path="/onboarding/mentee" element={
            <ProtectedRoute requireOnboarding={false}>
              <MenteeOnboardingPage />
            </ProtectedRoute>
          } />

          {/* Dashboard routes (fully protected) */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/explore" element={<ExploreMentorsPage />} />
            <Route path="/mentor/:id" element={<MentorProfilePage />} />
            <Route path="/mentee/:id" element={<MenteeProfilePage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/ratings" element={<RatingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
      </ThemeProvider>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
