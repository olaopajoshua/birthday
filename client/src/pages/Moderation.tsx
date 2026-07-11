import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, X, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Moderation() {
  const { isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const [, navigate] = useLocation();
  const [projectId, setProjectId] = useState<number | null>(null);

  // Get project ID from URL
  useEffect(() => {
    const match = window.location.pathname.match(/\/moderation\/(\d+)/);
    if (match) {
      setProjectId(parseInt(match[1]));
    }
  }, []);

  const projectQuery = trpc.projects.get.useQuery(
    { id: projectId || undefined },
    { enabled: isAuthenticated && projectId !== null }
  );

  const contributionsQuery = trpc.contributions.list.useQuery(
    { projectId: projectId || 0 },
    { enabled: Boolean(projectId) }
  );

  const updateContributionMutation = trpc.contributions.updateStatus.useMutation({
    onSuccess: () => {
      contributionsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update contribution");
    },
  });

  const deleteContributionMutation = trpc.contributions.delete.useMutation({
    onSuccess: () => {
      toast.success("Contribution deleted");
      contributionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete contribution");
    },
  });

  const handleApprove = (id: number) => {
    updateContributionMutation.mutate({
      id,
      status: "approved" as const,
    });
  };

  const handleReject = (id: number) => {
    updateContributionMutation.mutate({
      id,
      status: "rejected" as const,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this contribution?")) {
      deleteContributionMutation.mutate({ id });
    }
  };

  const pendingContributions = (contributionsQuery.data || []).filter(
    (c) => c.status === "pending"
  );
  const approvedContributions = (contributionsQuery.data || []).filter(
    (c) => c.status === "approved"
  );
  const rejectedContributions = (contributionsQuery.data || []).filter(
    (c) => c.status === "rejected"
  );

  if (!projectId || projectQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading moderation panel...</p>
        </div>
      </div>
    );
  }

  if (!projectQuery.data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Project Not Found
          </h2>
          <Button onClick={() => navigate("/dashboard")} className="w-full mt-4">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 animate-slide-in-down">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="p-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">
              Review Contributions
            </h1>
          </div>
          <div className="text-sm text-slate-600">
            {pendingContributions.length} pending
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Pending Contributions */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Pending Review ({pendingContributions.length})
          </h2>
          {pendingContributions.length > 0 ? (
            <div className="grid gap-4">
              {pendingContributions.map((contribution) => (
                <Card key={contribution.id} className="p-6">
                  <div className="flex gap-4">
                    {/* Profile Photo */}
                    {contribution.profilePhotoUrl && (
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                          <img
                            src={contribution.profilePhotoUrl}
                            alt={contribution.contributorName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {contribution.contributorName}
                      </h3>
                      <p className="text-slate-700 mt-2 line-clamp-2">
                        {contribution.message}
                      </p>

                      {/* Photos */}
                      {(contribution.profilePhotoUrl ||
                        contribution.photoWithCelebrantUrl) && (
                        <div className="flex gap-2 mt-3">
                          {contribution.profilePhotoUrl && (
                            <div className="w-16 h-16 rounded overflow-hidden bg-slate-200">
                              <img
                                src={contribution.profilePhotoUrl}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {contribution.photoWithCelebrantUrl && (
                            <div className="w-16 h-16 rounded overflow-hidden bg-slate-200">
                              <img
                                src={contribution.photoWithCelebrantUrl}
                                alt="With celebrant"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(contribution.id)}
                        disabled={updateContributionMutation.isPending}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(contribution.id)}
                        disabled={updateContributionMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(contribution.id)}
                        disabled={deleteContributionMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-slate-600">No pending contributions</p>
            </Card>
          )}
        </div>

        {/* Approved Contributions */}
        {approvedContributions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Approved ({approvedContributions.length})
            </h2>
            <div className="grid gap-4">
              {approvedContributions.map((contribution) => (
                <Card
                  key={contribution.id}
                  className="p-6 bg-green-50 border-green-200"
                >
                  <div className="flex gap-4">
                    {contribution.profilePhotoUrl && (
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                          <img
                            src={contribution.profilePhotoUrl}
                            alt={contribution.contributorName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {contribution.contributorName}
                      </h3>
                      <p className="text-slate-700 mt-2 line-clamp-2">
                        {contribution.message}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(contribution.id)}
                        disabled={updateContributionMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Contributions */}
        {rejectedContributions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Rejected ({rejectedContributions.length})
            </h2>
            <div className="grid gap-4">
              {rejectedContributions.map((contribution) => (
                <Card
                  key={contribution.id}
                  className="p-6 bg-red-50 border-red-200 opacity-75"
                >
                  <div className="flex gap-4">
                    {contribution.profilePhotoUrl && (
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                          <img
                            src={contribution.profilePhotoUrl}
                            alt={contribution.contributorName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {contribution.contributorName}
                      </h3>
                      <p className="text-slate-700 mt-2 line-clamp-2">
                        {contribution.message}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApprove(contribution.id)}
                        disabled={updateContributionMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
