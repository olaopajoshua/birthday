import { useAuth } from "@/_core/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { useLocation } from "wouter";

const PROTECTED_PATHS = ["/dashboard", "/editor", "/settings", "/projects"];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      // Check if current path starts with any protected path
      const isProtected = PROTECTED_PATHS.some((path) =>
        currentPath === path || currentPath.startsWith(path + "/")
      );

      if (isProtected) {
        navigate("/login");
      }
    }
  }, [loading, isAuthenticated, navigate]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
