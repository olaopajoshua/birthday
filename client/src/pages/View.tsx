import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, Share2, MessageCircle, Image as ImageIcon, Music, Calendar, Copy, PartyPopper } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const SECTION_LABELS: Record<string, string> = {
  welcome: "Welcome",
  story: "Story",
  gallery: "Gallery",
  wishes: "Birthday Wishes",
  closing: "Thank You",
};

const SPOTIFY_EMBED_URL = (uri: string) => {
  let trackId = uri;
  if (uri.includes("spotify.com/track/")) {
    trackId = uri.split("track/")[1]?.split("?")[0] || "";
  } else if (uri.startsWith("spotify:track:")) {
    trackId = uri.replace("spotify:track:", "");
  }
  return trackId ? `https://open.spotify.com/embed/track/${trackId}` : null;
};

// Confetti canvas component
function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (!active) return;
    const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
    const newParticles = Array.from({ length: 60 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      color: colors[i % colors.length],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    }));
    setParticles(newParticles);
  }, [active]);

  useEffect(() => {
    if (!active || particles.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setParticles(prev => {
        const updated = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.05,
          rotation: p.rotation + p.rotationSpeed,
        })).filter(p => p.y < canvas.height + 20);
        return updated;
      });
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [active, particles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
  }, [particles]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

export default function View() {
  const [, navigate] = useLocation();
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const match = window.location.pathname.match(/\/view\/(.+)/);
    if (match) {
      setPublicUrl(match[1]);
    }
  }, []);

  const projectQuery = trpc.projects.get.useQuery(
    { publicUrl: publicUrl || undefined },
    { enabled: publicUrl !== null }
  );

  const sectionsQuery = trpc.sections.list.useQuery(
    { projectId: projectQuery.data?.id || 0 },
    { enabled: Boolean(projectQuery.data?.id) }
  );

  const handleCopyContributionLink = () => {
    if (publicUrl) {
      const url = `${window.location.origin}/contribute/${publicUrl}`;
      navigator.clipboard.writeText(url);
      toast.success("Contribution link copied!");
    }
  };

  const handleCopyPublishedLink = () => {
    if (publicUrl) {
      const url = `${window.location.origin}/view/${publicUrl}`;
      navigator.clipboard.writeText(url);
      toast.success("Published link copied!");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${projectQuery.data?.celebrantName}'s Birthday Keepsake`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (projectQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading birthday keepsake...</p>
        </div>
      </div>
    );
  }

  if (!projectQuery.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Keepsake Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            This birthday keepsake doesn't exist or hasn't been published yet.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const project = projectQuery.data;

  // Don't show unpublished drafts to the public
  if (project.status !== "published") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Coming Soon
          </h2>
          <p className="text-slate-600 mb-6">
            This birthday keepsake is still being prepared. Check back soon!
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const sections = sectionsQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 animate-fade-in">
      <ConfettiCanvas active={showConfetti} />

      {/* Header with Cover Photo */}
      <header className="relative">
        {project.coverPhotoUrl && (
          <div className="absolute inset-0 h-64 md:h-80">
            <img
              src={project.coverPhotoUrl}
              alt={project.celebrantName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent"></div>
          </div>
        )}
        <div className={`relative ${project.coverPhotoUrl ? 'pt-48 md:pt-64' : 'pt-8'} pb-12`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-rose-300" />
              <span className="text-sm font-semibold text-rose-300">Birthday Keepsake</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Happy Birthday, {project.celebrantName}!
            </h1>
            {project.birthdayDate && (
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-4 h-4" />
                <span>{new Date(project.birthdayDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Spotify Player */}
      {project.spotifyUrl && SPOTIFY_EMBED_URL(project.spotifyUrl) && (
        <section className="container mx-auto px-4 -mt-4 mb-8">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-slate-600">Birthday Song</span>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <iframe
                src={SPOTIFY_EMBED_URL(project.spotifyUrl)!}
                width="100%"
                height="80"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="rounded-xl"
              ></iframe>
            </div>
          </div>
        </section>
      )}

      {/* Welcome Message */}
      {project.welcomeMessage && (
        <section className="container mx-auto px-4 mb-12">
          <Card className="p-8 max-w-3xl mx-auto text-center bg-white/80 backdrop-blur-sm">
            <p className="text-lg md:text-xl text-slate-700 italic leading-relaxed">
              "{project.welcomeMessage}"
            </p>
          </Card>
        </section>
      )}

      {/* Sections Rendering */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {sections.map((section) => (
            <div key={section.id} className="animate-fade-in">
              {/* Welcome Section */}
              {section.type === "welcome" && (
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">
                    {SECTION_LABELS[section.type]}
                  </h2>
                  {section.content && (
                    <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
                      {section.content}
                    </p>
                  )}
                  {section.imageUrl && (
                    <div className="mt-6 rounded-xl overflow-hidden max-w-2xl mx-auto">
                      <img src={section.imageUrl} alt="Welcome" className="w-full max-h-96 object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* Story Section */}
              {section.type === "story" && (
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <h2 className="text-3xl font-bold text-slate-900 mb-6">
                    {SECTION_LABELS[section.type]}
                  </h2>
                  {section.content && (
                    <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  )}
                  {section.imageUrl && (
                    <div className="mt-6 rounded-xl overflow-hidden">
                      <img src={section.imageUrl} alt="Story" className="w-full max-h-96 object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* Gallery Section */}
              {section.type === "gallery" && (
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
                    <ImageIcon className="w-8 h-8 inline mr-2 text-rose-500" />
                    {SECTION_LABELS[section.type]}
                  </h2>
                  {section.content && (
                    <p className="text-slate-600 text-center mb-6 max-w-2xl mx-auto">{section.content}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {section.imageUrl && (
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-200 shadow-sm">
                        <img
                          src={section.imageUrl}
                          alt="Gallery"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Wishes Section */}
              {section.type === "wishes" && (
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <MessageCircle className="w-6 h-6 text-rose-500" />
                    <h2 className="text-3xl font-bold text-slate-900">
                      {SECTION_LABELS[section.type]}
                    </h2>
                  </div>
                  {section.content && (
                    <p className="text-slate-600 mb-6">{section.content}</p>
                  )}
                  <div className="text-center p-8 bg-slate-50 rounded-xl">
                    <Heart className="w-8 h-8 text-rose-300 mx-auto mb-3" />
                    <p className="text-slate-600">
                      Birthday wishes collected from friends and family will appear here.
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Share the contribution link to let loved ones add their wishes.
                    </p>
                  </div>
                </div>
              )}

              {/* Closing Section */}
              {section.type === "closing" && (
                <div className="text-center bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-8">
                  <PartyPopper className="w-8 h-8 text-rose-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">
                    {SECTION_LABELS[section.type]}
                  </h2>
                  {section.content && (
                    <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
                      {section.content}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Share / Contribute Links */}
      <section className="bg-white border-t border-slate-200">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Share This Keepsake</h3>
            <p className="text-sm text-slate-600">
              Share the published page with everyone, or the contribution link with friends and family who want to add wishes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCopyPublishedLink}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Published Page
              </Button>
              <Button
                onClick={handleCopyContributionLink}
                variant="outline"
                className="flex-1 text-rose-600"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Contribute
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-medium text-white">Birthday Keepsake</span>
          </div>
          <p className="text-xs text-slate-500">
            Created with love for {project.celebrantName}
          </p>
        </div>
      </footer>
    </div>
  );
}
