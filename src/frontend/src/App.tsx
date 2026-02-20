import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from './hooks/queries/useAuth';
import { useActorSession, ActorSessionProvider } from './context/ActorSessionContext';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TopLevelErrorBoundary } from './components/auth/TopLevelErrorBoundary';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import PartiesPage from './pages/PartiesPage';
import PartyDetailsPage from './pages/PartyDetailsPage';
import NewPartyVisitPage from './pages/NewPartyVisitPage';
import VisitDetailsPage from './pages/VisitDetailsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoginScreen from './components/auth/LoginScreen';
import StartupLoadingScreen from './components/auth/StartupLoadingScreen';
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

  // Due today alert - only runs when authenticated and actor is ready
  const { partiesDueToday, dismissAlert } = useDueTodayAlert();

  // Bootstrap phase 1: Internet Identity initialization
  if (isInitializing) {
    return <StartupLoadingScreen message="Loading..." />;
  }

  // Bootstrap phase 2: Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Bootstrap phase 3: Actor initialization error
  if (actorError) {
    return <BootstrapErrorScreen onRetry={() => retryActor()} />;
  }

  // Bootstrap phase 4: Actor loading
  if (actorLoading || !actor) {
    return <StartupLoadingScreen message="Initializing..." />;
  }

  // Bootstrap phase 5: Profile fetch error
  if (profileError) {
    return <ProfileBootstrapErrorScreen onRetry={() => retryProfile()} />;
  }

  // Bootstrap phase 6: Profile loading (only show if not yet fetched)
  if (profileLoading && !profileFetched) {
    return <StartupLoadingScreen message="Loading profile..." />;
  }

  // Bootstrap complete - render main app with router
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
    <TopLevelErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ActorSessionProvider>
          <AppContent />
        </ActorSessionProvider>
      </ThemeProvider>
    </TopLevelErrorBoundary>
  );
}
