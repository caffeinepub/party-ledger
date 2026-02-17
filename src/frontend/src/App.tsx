import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from './hooks/queries/useAuth';
import { useActorSession } from './context/ActorSessionContext';
import { useStaffAuthContext } from './context/StaffAuthContext';
import { useAppReadiness } from './context/AppReadinessContext';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import PartiesPage from './pages/PartiesPage';
import PartyDetailsPage from './pages/PartyDetailsPage';
import NewPartyVisitPage from './pages/NewPartyVisitPage';
import VisitDetailsPage from './pages/VisitDetailsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoginScreen from './components/auth/LoginScreen';
import StaffLoginScreen from './components/auth/StaffLoginScreen';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import BootstrapErrorScreen from './components/auth/BootstrapErrorScreen';
import ProfileBootstrapErrorScreen from './components/auth/ProfileBootstrapErrorScreen';
import DueTodayDialog from './components/alerts/DueTodayDialog';
import { useDueTodayAlert } from './hooks/useDueTodayAlert';
import { useState } from 'react';

function Layout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const partiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/parties',
  component: PartiesPage,
});

const partyDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/party/$partyId',
  component: PartyDetailsPage,
});

const visitDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/visit/$partyId/$paymentId',
  component: VisitDetailsPage,
});

const newVisitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new-visit',
  component: NewPartyVisitPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  partiesRoute,
  partyDetailsRoute,
  visitDetailsRoute,
  newVisitRoute,
  reportsRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  const { identity, loginStatus } = useInternetIdentity();
  const { actor, isLoading: actorLoading, isError: actorError, refetch: retryActor } = useActorSession();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched, isError: profileError, refetch: retryProfile } = useGetCallerUserProfile();
  const { mutate: saveProfile } = useSaveCallerUserProfile();
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);

  const { isStaffAuthenticated } = useStaffAuthContext();
  const { isAppReadyForMainData } = useAppReadiness();

  const isAuthenticated = !!identity;
  const isInitializing = loginStatus === 'initializing';

  // Show profile setup dialog when authenticated but no profile exists
  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null && !profileSetupOpen;

  const handleProfileSave = (name: string) => {
    saveProfile({ name }, {
      onSuccess: () => {
        setProfileSetupOpen(false);
      },
    });
  };

  // Due today alert - only runs when app is ready for main data
  const { partiesDueToday, dismissAlert } = useDueTodayAlert();

  // Handle initialization state
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen for unauthenticated users
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Handle actor initialization errors
  if (actorError) {
    return <BootstrapErrorScreen onRetry={() => retryActor()} />;
  }

  // Show loading while actor is initializing
  if (actorLoading || !actor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Handle profile fetch errors
  if (profileError) {
    return <ProfileBootstrapErrorScreen onRetry={() => retryProfile()} />;
  }

  // Show loading only while profile is actively being fetched
  if (profileLoading && !profileFetched) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show staff login screen if not authenticated at staff level
  if (!isStaffAuthenticated) {
    return <StaffLoginScreen />;
  }

  return (
    <>
      <RouterProvider router={router} />
      <ProfileSetupDialog
        open={showProfileSetup || profileSetupOpen}
        onSave={handleProfileSave}
      />
      <DueTodayDialog
        parties={partiesDueToday}
        open={partiesDueToday.length > 0}
        onClose={dismissAlert}
      />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppContent />
    </ThemeProvider>
  );
}
