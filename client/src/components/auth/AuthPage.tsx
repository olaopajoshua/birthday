import { Heart } from "lucide-react";

interface AuthPageProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthPage({ children, title, subtitle }: AuthPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-5 shadow-sm">
            <Heart className="h-7 w-7 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
