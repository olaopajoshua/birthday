import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthGuard } from "./components/auth/AuthGuard";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Contribute from "./pages/Contribute";
import View from "./pages/View";
import Moderation from "./pages/Moderation";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/signup"} component={Signup} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/view/:url"} component={View} />
      <Route path={"/contribute/:url"} component={Contribute} />

      {/* Protected routes */}
      <Route path={"/dashboard"}>
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route path={"/editor/:id"}>
        <AuthGuard>
          <Editor />
        </AuthGuard>
      </Route>
      <Route path={"/moderation/:id"}>
        <AuthGuard>
          <Moderation />
        </AuthGuard>
      </Route>

      {/* 404 */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
