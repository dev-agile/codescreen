import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import Dashboard from "@/pages/dashboard";
import TestsIndex from "@/pages/tests/index";
import CreateTest from "@/pages/tests/create";
import EditTest from "@/pages/tests/edit";
import ViewTest from "@/pages/tests/view";
import CandidatesIndex from "@/pages/candidates/index";
import CandidateTest from "@/pages/candidate/test";
import CandidateComplete from "@/pages/candidate/complete";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Agency Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/tests" component={TestsIndex} />
      <Route path="/tests/create" component={CreateTest} />
      <Route path="/tests/:id/edit" component={EditTest} />
      <Route path="/tests/:id" component={ViewTest} />
      <Route path="/candidates" component={CandidatesIndex} />
      
      {/* Candidate Routes */}
      <Route path="/take-test/:testLink" component={CandidateTest} />
      <Route path="/test-complete" component={CandidateComplete} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
