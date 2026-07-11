import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Users, Lock, Share2, Sparkles, Image } from "lucide-react";
import { useLocation } from "wouter";
import { startLogin } from "@/const";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      startLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 animate-fade-in">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 animate-slide-in-down" role="banner">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" aria-hidden="true" />
            <span className="text-xl font-bold text-slate-900">Birthday Keepsake</span>
          </div>
          <nav className="flex items-center gap-3" aria-label="Main navigation">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} variant="default" aria-label="Go to dashboard">
                Dashboard
              </Button>
            ) : (
              <Button onClick={startLogin} variant="default" aria-label="Sign in to your account">
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32" aria-label="Hero section">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                Create a Beautiful Birthday Tribute
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
                Celebrate your loved one with an elegant, shareable birthday website. Collect heartfelt wishes, photos, and memories in one beautiful place.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                Create Your First Keepsake
              </Button>
              <Button size="lg" variant="outline">
                View Example
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>No credit card required • Takes 5 minutes to set up</span>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-pink-100 rounded-3xl blur-3xl opacity-30"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
              <div className="space-y-4">
                <div className="h-32 bg-gradient-to-br from-rose-200 to-pink-200 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-4">
                  <div className="h-20 bg-slate-100 rounded"></div>
                  <div className="h-20 bg-slate-100 rounded"></div>
                  <div className="h-20 bg-slate-100 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-t border-slate-200">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-600">
              A complete platform for creating, sharing, and celebrating birthdays
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-8 border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Beautiful Design</h3>
              <p className="text-slate-600">
                Elegant, premium layouts that make every birthday feel special and memorable.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Collect Wishes</h3>
              <p className="text-slate-600">
                Guests can easily submit heartfelt messages and photos without creating an account.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Full Control</h3>
              <p className="text-slate-600">
                Approve submissions before they appear, and control when your birthday site goes live.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-8 border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Easy Sharing</h3>
              <p className="text-slate-600">
                Share a unique link with your guests. Each keepsake has its own beautiful public URL.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="p-8 border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Image className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Photo Gallery</h3>
              <p className="text-slate-600">
                Showcase beautiful photos from the celebrant and guests in an elegant gallery.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="p-8 border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">AI Assistant</h3>
              <p className="text-slate-600">
                Get help writing the perfect birthday message with our intelligent writing suggestions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600">
            Three simple steps to create a beautiful birthday keepsake
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-rose-600">1</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Create & Customize</h3>
            <p className="text-slate-600">
              Set up your birthday project with the celebrant's name, photo, and welcome message.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Share & Collect</h3>
            <p className="text-slate-600">
              Share your unique link with guests. They submit wishes, messages, and photos easily.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-purple-600">3</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Publish & Celebrate</h3>
            <p className="text-slate-600">
              Approve submissions and publish your keepsake to share the beautiful birthday tribute.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-rose-50 to-pink-50 border-t border-slate-200">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Ready to Create a Birthday Keepsake?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Start celebrating your loved ones with a beautiful, personalized birthday website.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-rose-500" />
                <span className="font-semibold text-white">Birthday Keepsake</span>
              </div>
              <p className="text-sm">
                Creating beautiful birthday tributes for people you love.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Examples</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Birthday Keepsake. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
