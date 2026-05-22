import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';
import ToastContainer from './components/Toast';

// Lazy-loaded pages (route-level code splitting)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthLayout = lazy(() => import('./pages/auth/AuthLayout'));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const AuthCallbackPage = lazy(() => import('./pages/auth/AuthCallbackPage'));
const MentorOnboardingPage = lazy(() => import('./pages/onboarding/MentorOnboardingPage'));
const MenteeOnboardingPage = lazy(() => import('./pages/onboarding/MenteeOnboardingPage'));
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const ExploreMentorsPage = lazy(() => import('./pages/explore/ExploreMentorsPage'));
const MentorProfilePage = lazy(() => import('./pages/mentor/MentorProfilePage'));
const MenteeProfilePage = lazy(() => import('./pages/mentee/MenteeProfilePage'));
const GoalsPage = lazy(() => import('./pages/goals/GoalsPage'));
const MessagesPage = lazy(() => import('./pages/messages/MessagesPage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const RatingsPage = lazy(() => import('./pages/ratings/RatingsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));

// Suspense fallback that matches the app's branded loading style
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient-subtle">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-green-200 border-t-brand-green-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-montserrat text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </AuthProvider>
      </ThemeProvider>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
