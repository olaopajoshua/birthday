import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { AuthPage } from "@/components/auth/AuthPage";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Spinner } from "@/components/ui/spinner";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Check if already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard");
    });
  }, [navigate]);

  // Validate form fields
  const validate = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Display the actual Supabase error message for debugging
        // In production, Supabase intentionally returns "Invalid login credentials"
        // for both wrong passwords AND unconfirmed emails (security by design)
        const actualError = error.message;
        
        // Provide a helpful hint if it's likely an unconfirmed email
        let displayError = actualError;
        if (
          actualError.toLowerCase().includes("invalid login credentials") ||
          actualError.toLowerCase().includes("invalid login")
        ) {
          displayError = "Invalid email or password. If you recently signed up, please check your email for a confirmation link before signing in.";
        }
        
        setErrors({ password: displayError });
        toast.error("Login failed", { description: actualError });
        return;
      }

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Something went wrong", { description: message });
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error("Google sign-in failed", { description: error.message });
      }
    } catch (err: unknown) {
      toast.error("Something went wrong", { description: err instanceof Error ? err.message : "Unknown error" });
      console.error("Google login error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Enter key submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEmailLogin(e as unknown as React.FormEvent);
    }
  };

  return (
    <AuthPage
      title="Welcome back"
      subtitle="Sign in to your Birthday Keepsake account to continue"
    >
      {/* Email & Password Form */}
      <form onSubmit={handleEmailLogin} onKeyDown={handleKeyDown} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="you@example.com"
            className="h-12 transition-all duration-200"
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <a
              href="/forgot-password"
              className="text-xs text-primary hover:underline underline-offset-2"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Enter your password"
            className="h-12 transition-all duration-200"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-sm text-destructive animate-fade-in">{errors.password}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(!!checked)}
          />
          <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Remember me
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <AuthDivider text="or continue with" />

      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 border-slate-200 hover:bg-slate-50"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Spinner className="h-4 w-4 mr-2" />
        ) : (
          <GoogleIcon />
        )}
        <span className="text-sm font-medium">Continue with Google</span>
      </Button>

      {/* Create Account Link */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-primary hover:underline underline-offset-2 font-medium">
          Create an account
        </a>
      </p>
    </AuthPage>
  );
}
