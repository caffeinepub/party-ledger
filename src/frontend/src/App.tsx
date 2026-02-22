import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { ActorSessionProvider } from './context/ActorSessionContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import PartiesPage from './pages/PartiesPage';
import PartyDetailsPage from './pages/PartyDetailsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NewPartyVisitPage from './pages/NewPartyVisitPage';
import VisitDetailsPage from './pages/VisitDetailsPage';
import MapPage from './pages/MapPage';
import AllPartiesListPage from './pages/AllPartiesListPage';
import DuplicatePartiesPage from './pages/DuplicatePartiesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { TopLevelErrorBoundary } from './components/auth/TopLevelErrorBoundary';
import AdminCredentialDialog from './components/auth/AdminCredentialDialog';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useAdminAuth } from './context/AdminAuthContext';
import { useEffect } from 'react';
import { useUpcomingEventChecker } from './hooks/useUpcomingEventChecker';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { identity } = useInternetIdentity();
  const { isAdminValidated, promptForCredentials } = useAdminAuth();

  useUpcomingEventChecker();

  useEffect(() => {
    if (identity && !isAdminValidated) {
      const timer = setTimeout(() => {
        promptForCredentials();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [identity, isAdminValidated, promptForCredentials]);

  return (
    <>
      <RouterProvider router={router} />
      <AdminCredentialDialog />
      <Toaster />
    </>
  );
}

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

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
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

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  component: MapPage,
});

const allPartiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/all-parties',
  component: AllPartiesListPage,
});

const duplicatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/duplicates',
  component: DuplicatePartiesPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  partiesRoute,
  partyDetailsRoute,
  reportsRoute,
  analyticsRoute,
  settingsRoute,
  newPartyVisitRoute,
  visitDetailsRoute,
  mapRoute,
  allPartiesRoute,
  duplicatesRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <TopLevelErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <ActorSessionProvider>
            <AdminAuthProvider>
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </AdminAuthProvider>
          </ActorSessionProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </TopLevelErrorBoundary>
  );
}
