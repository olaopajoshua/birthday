import { useEffect, useState, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Heart, Mail, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { AuthPage } from "@/components/auth/AuthPage";
import { Spinner } from "@/components/ui/spinner";

type Step = "request" | "sent" | "reset" | "done";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  // Check for access_token / refresh_token in URL hash (Supabase redirect)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token") || hash.includes("type=recovery")) {
      // Extract params from hash
      const params = new URLSearchParams(hash.replace("#", "?"));
      const type = params.get("type");
      if (type === "recovery" || params.has("access_token")) {
        setStep("reset");
        setEmail(params.get("email") || "");
      }
    }
  }, []);

  // Check if already authenticated (for reset step)
  useEffect(() => {
    if (step === "reset") return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard");
    });
  }, [navigate, step]);

  // Listen for auth state changes during password reset
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (step !== "done" && step !== "reset") {
          // Could handle session-based password change here
        }
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [step]);

  const validateEmail = useCallback(() => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    setError("");
    return true;
  }, [email]);

  const validatePassword = useCallback(() => {
    if (!newPassword) {
      setError("Password is required");
      return false;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    setError("");
    return true;
  }, [newPassword, confirmPassword]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/forgot-password`,
        }
      );

      if (resetError) {
        // For security, Supabase doesn't differentiate between valid/invalid emails
        // Always show the success message
      }

      setStep("sent");
      toast.success("Reset email sent! Check your inbox.");
    } catch (err: unknown) {
      toast.error("Something went wrong. Please try again.");
      console.error("Reset request error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        toast.error("Failed to reset password");
        return;
      }

      setSuccess(true);
      setStep("done");
      toast.success("Password updated successfully!");
    } catch (err: unknown) {
      toast.error("Something went wrong. Please try again.");
      console.error("Password update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (step === "request") {
        handleRequestReset(e as unknown as React.FormEvent);
      } else if (step === "reset") {
        handlePasswordReset(e as unknown as React.FormEvent);
      }
    }
  };

  // Step: Email Sent Confirmation
  if (step === "sent") {
    return (
      <AuthPage
        title="Check your email"
        subtitle={`We've sent a password reset link to ${email}. Please check your inbox.`}
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Email sent successfully
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Click the link in the email to reset your password. If you don't see the email, check your spam folder.
          </p>
          <Button
            variant="outline"
            className="h-12 w-full"
            onClick={() => setStep("request")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Send to a different email
          </Button>
          <div className="mt-4">
            <a
              href="/login"
              className="text-sm text-primary hover:underline underline-offset-2"
            >
              Back to sign in
            </a>
          </div>
        </div>
      </AuthPage>
    );
  }

  // Step: Reset Password (after clicking email link)
  if (step === "reset") {
    return (
      <AuthPage
        title="Reset your password"
        subtitle="Enter your new password below"
      >
        <form onSubmit={handlePasswordReset} onKeyDown={handleKeyDown} className="space-y-5">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter new password"
              className="h-12 transition-all duration-200"
              autoComplete="new-password"
              aria-invalid={!!error}
            />
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
                if (error) setError("");
              }}
              placeholder="Confirm new password"
              className="h-12 transition-all duration-200"
              autoComplete="new-password"
              aria-invalid={!!error}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive animate-fade-in">{error}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Updating password...
              </>
            ) : (
              <>
                Update password
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6">
          <a
            href="/login"
            className="text-sm text-primary hover:underline underline-offset-2"
          >
            Back to sign in
          </a>
        </div>
      </AuthPage>
    );
  }

  // Step: Done (password successfully reset)
  if (step === "done") {
    return (
      <AuthPage
        title="Password updated"
        subtitle="Your password has been successfully reset. You can now sign in with your new password."
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Password reset successful
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Your password has been updated. You can now sign in with your new credentials.
          </p>
          <Button
            className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-medium"
            onClick={() => navigate("/login")}
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Go to sign in
          </Button>
        </div>
      </AuthPage>
    );
  }

  // Step: Request Reset (initial)
  return (
    <AuthPage
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to reset your password"
    >
      <form onSubmit={handleRequestReset} onKeyDown={handleKeyDown} className="space-y-5">
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
              if (error) setError("");
            }}
            placeholder="you@example.com"
            className="h-12 transition-all duration-200"
            autoComplete="email"
            aria-invalid={!!error}
          />
          {error && (
            <p className="text-sm text-destructive animate-fade-in">{error}</p>
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
              Sending reset link...
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6">
        <a
          href="/login"
          className="text-sm text-primary hover:underline underline-offset-2 flex items-center gap-1 justify-center"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </a>
      </div>
    </AuthPage>
  );
}
