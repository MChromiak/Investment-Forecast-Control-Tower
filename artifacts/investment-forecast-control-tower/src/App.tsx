import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

import { AppLayout } from '@/components/layout';
import NotFound from '@/pages/not-found';

import OverviewPage from '@/pages/overview';
import ForecastCyclePage from '@/pages/forecast-cycle';
import InputDocumentsPage from '@/pages/input-documents';
import WbsForecastPage from '@/pages/wbs-forecast';
import ExceptionsPage from '@/pages/exceptions';
import VowdPage from '@/pages/vowd';
import SacSubmissionPage from '@/pages/sac-submission';
import ReportsPage from '@/pages/reports';
import AuditPage from '@/pages/audit';
import ScenariosPage from '@/pages/scenarios';
import SettingsPage from '@/pages/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

import { DisclaimerGate } from '@/components/disclaimer-gate';

function Router() {
  return (
    <DisclaimerGate>
      <AppLayout>
        <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={OverviewPage} />
          <Route path="/forecast-cycle" component={ForecastCyclePage} />
          <Route path="/input-documents" component={InputDocumentsPage} />
          <Route path="/wbs-forecast" component={WbsForecastPage} />
          <Route path="/exceptions" component={ExceptionsPage} />
          <Route path="/vowd" component={VowdPage} />
          <Route path="/sac-submission" component={SacSubmissionPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/audit" component={AuditPage} />
          <Route path="/scenarios" component={ScenariosPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppLayout>
  </DisclaimerGate>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
