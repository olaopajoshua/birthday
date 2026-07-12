import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowRight, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { AuthPage } from "@/components/auth/AuthPage";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Spinner } from "@/components/ui/spinner";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function Signup() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  // Check if already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard");
    });
  }, [navigate]);

  // Validate form fields
  const validate = useCallback(() => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "Full name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password && confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, password, confirmPassword]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        // Show the actual Supabase error for debugging
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          setErrors({ email: "An account with this email already exists. Please sign in instead." });
          toast.error("Account already exists");
        } else {
          toast.error("Signup failed", { description: error.message });
          setErrors({ email: error.message });
        }
        return;
      }

      // Check if the user needs email verification
      // If data.session is null, the user was created but email confirmation is required
      if (!data.session) {
        setVerificationEmail(email.trim().toLowerCase());
        setNeedsVerification(true);
        toast.success("Account created! Please check your email to confirm your account.");
        return;
      }

      // User was auto-confirmed (email confirmation disabled in Supabase)
      toast.success("Account created! Welcome!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Something went wrong", { description: message });
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error("Google sign-up failed", { description: error.message });
      }
    } catch (err: unknown) {
      toast.error("Something went wrong", { description: err instanceof Error ? err.message : "Unknown error" });
      console.error("Google signup error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: verificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error("Failed to resend", { description: error.message });
        return;
      }

      toast.success("Verification email resent!");
    } catch (err: unknown) {
      toast.error("Something went wrong", { description: err instanceof Error ? err.message : "Unknown error" });
      console.error("Resend error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (needsVerification) return;
      handleSignup(e as unknown as React.FormEvent);
    }
  };

  // Verification needed state
  if (needsVerification) {
    return (
      <AuthPage
        title="Verify your email"
        subtitle={`We've sent a confirmation link to ${verificationEmail}. Please check your inbox to activate your account.`}
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Almost there!
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Please click the confirmation link in the email we sent to <strong>{verificationEmail}</strong>. After confirming, you'll be able to sign in.
          </p>
          <div className="space-y-3 w-full">
            <Button
              className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => navigate("/login")}
            >
              Go to sign in
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleResendVerification}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Resending...
                </>
              ) : (
                "Resend verification email"
              )}
            </Button>
          </div>
          <div className="mt-6">
            <a
              href="/login"
              className="text-sm text-primary hover:underline underline-offset-2"
            >
              Already confirmed? Sign in
            </a>
          </div>
        </div>
      </AuthPage>
    );
  }

  return (
    <AuthPage
      title="Create your account"
      subtitle="Start creating beautiful birthday keepsakes for your loved ones"
    >
      {/* Form */}
      <form onSubmit={handleSignup} onKeyDown={handleKeyDown} className="space-y-5">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Enter your full name"
            className="h-12 transition-all duration-200"
            autoComplete="name"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive animate-fade-in">{errors.name}</p>
          )}
        </div>

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
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Create a strong password"
            className="h-12 transition-all duration-200"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
          />
          <PasswordStrength password={password} />
          {errors.password && (
            <p className="text-sm text-destructive animate-fade-in">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            placeholder="Confirm your password"
            className="h-12 transition-all duration-200"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive animate-fade-in">{errors.confirmPassword}</p>
          )}
          {confirmPassword && password && confirmPassword === password && (
            <p className="text-sm text-emerald-600 animate-fade-in flex items-center gap-1">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Passwords match
            </p>
          )}
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
              Creating account...
            </>
          ) : (
            <>
              Create account
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
        onClick={handleGoogleSignup}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Spinner className="h-4 w-4 mr-2" />
        ) : (
          <GoogleIcon />
        )}
        <span className="text-sm font-medium">Continue with Google</span>
      </Button>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-primary hover:underline underline-offset-2 font-medium">
          Sign in
        </a>
      </p>
    </AuthPage>
  );
}
