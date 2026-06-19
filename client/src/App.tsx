import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Meetings from "./pages/Meetings";
import Proposals from "./pages/Proposals";
import ProposalView from "./pages/ProposalView";
import Contracts from "./pages/Contracts";
import FollowUps from "./pages/FollowUps";
import Trials from "./pages/Trials";
import Referrals from "./pages/Referrals";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/leads" component={Leads} />
      <Route path="/leads/:id" component={LeadDetail} />
      <Route path="/meetings" component={Meetings} />
      <Route path="/proposals" component={Proposals} />
      <Route path="/proposals/view/:token" component={ProposalView} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/follow-ups" component={FollowUps} />
      <Route path="/trials" component={Trials} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/settings" component={Settings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
