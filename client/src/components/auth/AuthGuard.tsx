import { useAuth } from "@/_core/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const PROTECTED_PATHS = ["/dashboard", "/editor", "/settings", "/projects"];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && !redirecting) {
      const currentPath = window.location.pathname;
      // Check if current path starts with any protected path
      const isProtected = PROTECTED_PATHS.some((path) =>
        currentPath === path || currentPath.startsWith(path + "/")
      );

      if (isProtected) {
        setRedirecting(true);
        navigate("/login");
      }
    }
  }, [loading, isAuthenticated, navigate, redirecting]);

  // Show loading while checking auth state — but only briefly
  // The loading state resolves once the auth.me query completes (with data or error)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  // If redirecting, don't render children
  if (redirecting) {
    return null;
  }

  return <>{children}</>;
}
