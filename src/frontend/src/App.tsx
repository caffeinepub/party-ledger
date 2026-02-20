import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/queries/useAuth';
import { ActorSessionProvider } from './context/ActorSessionContext';
import LoginScreen from './components/auth/LoginScreen';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import PartiesPage from './pages/PartiesPage';
import PartyDetailsPage from './pages/PartyDetailsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NewPartyVisitPage from './pages/NewPartyVisitPage';
import VisitDetailsPage from './pages/VisitDetailsPage';
import StartupLoadingScreen from './components/auth/StartupLoadingScreen';
import { TopLevelErrorBoundary } from './components/auth/TopLevelErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
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
  path: '/parties/$partyId',
  component: PartyDetailsPage,
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

const newPartyVisitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new-visit',
  component: NewPartyVisitPage,
});

const visitDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/visits/$visitId',
  component: VisitDetailsPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  partiesRoute,
  partyDetailsRoute,
  reportsRoute,
  settingsRoute,
  newPartyVisitRoute,
  visitDetailsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  if (isInitializing) {
    return <StartupLoadingScreen message="Initializing authentication..." />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (showProfileSetup) {
    return <ProfileSetupDialog open={true} />;
  }

  if (profileLoading || !isFetched) {
    return <StartupLoadingScreen message="Loading your profile..." />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <TopLevelErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <ActorSessionProvider>
            <AppContent />
            <Toaster />
          </ActorSessionProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </TopLevelErrorBoundary>
  );
}
