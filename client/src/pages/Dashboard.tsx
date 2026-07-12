import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Heart, Plus, Edit2, Trash2, Eye, Copy, Calendar, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const [, navigate] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    celebrantName: "",
    birthdayDate: "",
    welcomeMessage: "",
  });

  const projectsQuery = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    staleTime: 0,
  });

  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Birthday keepsake created!");
      setFormData({ celebrantName: "", birthdayDate: "", welcomeMessage: "" });
      setIsCreateOpen(false);
      projectsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create keepsake");
    },
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Keepsake deleted");
      projectsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete keepsake");
    },
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.celebrantName || !formData.birthdayDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createProjectMutation.mutateAsync({
      celebrantName: formData.celebrantName,
      birthdayDate: new Date(formData.birthdayDate),
      welcomeMessage: formData.welcomeMessage || undefined,
    });
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Are you sure you want to delete this keepsake? This action cannot be undone.")) {
      deleteProjectMutation.mutate({ id: projectId });
    }
  };

  const handleCopyLink = (publicUrl: string) => {
    const url = `${window.location.origin}/contribute/${publicUrl}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  // Phase 1: Auth loading — redirectOnUnauthenticated handles the redirect
  // This is brief and only shows while the auth.me query resolves
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your keepsakes...</p>
        </div>
      </div>
    );
  }

  // Phase 2: Auth error — show error with retry option
  if (isAuthenticated === false && user === null) {
    // The redirectOnUnauthenticated effect will handle this,
    // but show a brief error state in case the redirect is slow
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Session expired</h2>
          <p className="text-slate-600 mb-4">Redirecting to login...</p>
          <Button onClick={() => window.location.href = "/login"}>
            Go to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 animate-slide-in-down" role="banner">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-rose-500" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-slate-900">My Birthday Keepsakes</h1>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            aria-label="Go back to home page"
          >
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Create New Button */}
        <div className="mb-8">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white" aria-label="Create a new birthday keepsake project">
                <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
                Create New Keepsake
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create a New Birthday Keepsake</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <Label htmlFor="celebrantName">Celebrant's Name *</Label>
                  <Input
                    id="celebrantName"
                    placeholder="e.g., Sarah"
                    value={formData.celebrantName}
                    onChange={(e) =>
                      setFormData({ ...formData, celebrantName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="birthdayDate">Birthday Date *</Label>
                  <Input
                    id="birthdayDate"
                    type="date"
                    value={formData.birthdayDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthdayDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="welcomeMessage">Welcome Message</Label>
                  <Textarea
                    id="welcomeMessage"
                    placeholder="A personal message to greet your guests..."
                    value={formData.welcomeMessage}
                    onChange={(e) =>
                      setFormData({ ...formData, welcomeMessage: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-600"
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Keepsake"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {projectsQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your keepsakes...</p>
          </div>
        ) : projectsQuery.isError ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Failed to load keepsakes
            </h3>
            <p className="text-slate-600 mb-4">
              {projectsQuery.error?.message || "An unexpected error occurred"}
            </p>
            <Button onClick={() => projectsQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : projectsQuery.data && projectsQuery.data.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsQuery.data.map((project, idx) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow animate-slide-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                {/* Project Cover */}
                <div className="h-32 bg-gradient-to-br from-rose-100 to-pink-100 relative">
                  {project.coverPhotoUrl && (
                    <img
                      src={project.coverPhotoUrl}
                      alt={project.celebrantName}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {project.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {project.celebrantName}'s Birthday
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.birthdayDate).toLocaleDateString()}
                    </div>
                  </div>

                  {project.welcomeMessage && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {project.welcomeMessage}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/editor/${project.id}`)}
                      className="flex-1"
                    >
                      <Edit2 className="w-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {project.publicUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(project.publicUrl!)}
                        title="Copy contribution link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    {project.publicUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/view/${project.publicUrl}`)}
                        title="View published site"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={deleteProjectMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No keepsakes yet
            </h3>
            <p className="text-slate-600 mb-6">
              Create your first birthday keepsake to get started
            </p>
            <Button
              size="lg"
              onClick={() => setIsCreateOpen(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Keepsake
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
