import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import MfaPage from "@/pages/mfa";
import SignupPage from "@/pages/signup";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import AuditLogPage from "@/pages/audit-log";

import DashboardHome from "@/pages/dashboard/home";
import PatientsPage from "@/pages/dashboard/patients";
import RecordsPage from "@/pages/dashboard/records";
import ReferralsPage from "@/pages/dashboard/referrals";
import SettingsPage from "@/pages/dashboard/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/mfa" component={MfaPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" component={DashboardHome} />
      <Route path="/dashboard/patients" component={PatientsPage} />
      <Route path="/dashboard/records" component={RecordsPage} />
      <Route path="/dashboard/referrals" component={ReferralsPage} />
      <Route path="/dashboard/settings" component={SettingsPage} />
      <Route path="/audit-log" component={AuditLogPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
