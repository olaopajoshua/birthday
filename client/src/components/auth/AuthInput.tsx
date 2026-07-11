import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export function AuthInput({
  label,
  error,
  showPasswordToggle = false,
  className,
  ...props
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === "password";

  return (
    <div className="space-y-2">
      <Label
        htmlFor={props.id}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          className={cn(
            "h-12 transition-all duration-200",
            error && "border-destructive focus-visible:ring-destructive/20",
            showPasswordToggle || isPassword ? "pr-12" : "",
            className
          )}
          type={showPasswordToggle && showPassword ? "text" : props.type}
          {...props}
        />
        {(showPasswordToggle || isPassword) && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive animate-fade-in">{error}</p>
      )}
    </div>
  );
}
