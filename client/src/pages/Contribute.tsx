import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Heart, Upload, Send, Wand2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Contribute() {
  const [, navigate] = useLocation();
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contributorName: "",
    message: "",
    profilePhotoUrl: "",
    photoWithCelebrantUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI suggestion state
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Get public URL from path
  useEffect(() => {
    const match = window.location.pathname.match(/\/contribute\/(.+)/);
    if (match) {
      setPublicUrl(match[1]);
    }
  }, []);

  const projectQuery = trpc.projects.get.useQuery(
    { publicUrl: publicUrl || undefined },
    { enabled: publicUrl !== null }
  );

  const createContributionMutation = trpc.contributions.create.useMutation({
    onSuccess: () => {
      toast.success("Your birthday wish has been submitted!");
      setFormData({
        contributorName: "",
        message: "",
        profilePhotoUrl: "",
        photoWithCelebrantUrl: "",
      });
      setTimeout(() => {
        navigate("/");
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit your wish");
      setIsSubmitting(false);
    },
  });

  const handleUploadPhoto = async (
    file: File,
    type: "profile" | "celebrant"
  ) => {
    try {
      const formData_ = new FormData();
      formData_.append("file", file);

      const response = await fetch("/api/upload/contribution", {
        method: "POST",
        body: formData_,
      });

      if (response.ok) {
        const data = await response.json();
        if (type === "profile") {
          setFormData({ ...formData, profilePhotoUrl: data.url });
        } else {
          setFormData({ ...formData, photoWithCelebrantUrl: data.url });
        }
        toast.success("Photo uploaded!");
      } else {
        toast.error("Failed to upload photo");
      }
    } catch (error) {
      toast.error("Failed to upload photo");
    }
  };

  // AI suggestion mutation
  const aiSuggestionMutation = trpc.ai.suggestContributionMessage.useMutation({
    onSuccess: (data) => {
      setAiSuggestions(data.suggestions);
      setAiLoading(false);
    },
    onError: (error) => {
      toast.error("Failed to generate suggestions");
      setAiLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contributorName || !formData.message || !projectQuery.data) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    await createContributionMutation.mutateAsync({
      projectId: projectQuery.data.id,
      contributorName: formData.contributorName,
      message: formData.message,
      profilePhotoUrl: formData.profilePhotoUrl || undefined,
      photoWithCelebrantUrl: formData.photoWithCelebrantUrl || undefined,
    });
  };

  const handleGenerateAISuggestions = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setAiLoading(true);
    try {
      await aiSuggestionMutation.mutateAsync({
        context: aiPrompt,
        celebrantName: projectQuery.data?.celebrantName || "",
      });
    } catch {
      setAiLoading(false);
    }
  };

  const handleUseAISuggestion = (suggestion: string) => {
    setFormData({ ...formData, message: suggestion });
    setShowAISuggestion(false);
    toast.success("AI suggestion applied!");
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
            This birthday keepsake doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 animate-slide-in-down">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-semibold text-rose-600">
              Birthday Keepsake
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Leave a Birthday Wish for {projectQuery.data.celebrantName}
          </h1>
          <p className="text-slate-600 mt-2">
            Share your heartfelt message and make their birthday special
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contributor Name */}
                <div>
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="What's your name?"
                    value={formData.contributorName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contributorName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* Birthday Message */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="message">Your Birthday Wish *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAISuggestion(!showAISuggestion)}
                      className="text-purple-600"
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      AI Suggest
                    </Button>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="Write your heartfelt birthday message here..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={5}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Share your favorite memory, a funny moment, or your wishes
                    for the year ahead.
                  </p>
                </div>

                {/* AI Suggestion Panel */}
                {showAISuggestion && (
                  <Card className="p-4 bg-purple-50 border-purple-200">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-purple-800">Describe your relationship</Label>
                        <Input
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="e.g., We've been best friends for 10 years, she loves hiking"
                          className="mt-1"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleGenerateAISuggestions}
                        disabled={aiLoading || !aiPrompt.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3 h-3 mr-2" />
                            Generate Suggestions
                          </>
                        )}
                      </Button>
                      {aiSuggestions.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {aiSuggestions.map((s, i) => (
                            <div
                              key={i}
                              className="p-3 bg-white rounded-lg border border-purple-100 cursor-pointer hover:border-purple-300 transition"
                              onClick={() => handleUseAISuggestion(s)}
                            >
                              <p className="text-sm text-slate-700">{s}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Profile Photo */}
                <div>
                  <Label>Your Photo (Optional)</Label>
                  <div className="mt-2">
                    {formData.profilePhotoUrl ? (
                      <div className="relative h-32 rounded-lg overflow-hidden">
                        <img
                          src={formData.profilePhotoUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="w-6 h-6 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadPhoto(file, "profile");
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 transition">
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">
                            Click to upload your photo
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadPhoto(file, "profile");
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Photo with Celebrant */}
                <div>
                  <Label>Photo with {projectQuery.data.celebrantName} (Optional)</Label>
                  <div className="mt-2">
                    {formData.photoWithCelebrantUrl ? (
                      <div className="relative h-32 rounded-lg overflow-hidden">
                        <img
                          src={formData.photoWithCelebrantUrl}
                          alt="With celebrant"
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="w-6 h-6 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadPhoto(file, "celebrant");
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 transition">
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">
                            Click to upload a photo together
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadPhoto(file, "celebrant");
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || createContributionMutation.isPending}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting || createContributionMutation.isPending
                    ? "Submitting..."
                    : "Submit Your Wish"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Celebrant Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Celebrating
              </h3>
              {projectQuery.data.coverPhotoUrl && (
                <div className="h-32 rounded-lg overflow-hidden mb-4 bg-slate-200">
                  <img
                    src={projectQuery.data.coverPhotoUrl}
                    alt={projectQuery.data.celebrantName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="text-lg font-semibold text-slate-900">
                {projectQuery.data.celebrantName}
              </p>
              {projectQuery.data.birthdayDate && (
                <p className="text-sm text-slate-600 mt-1">
                  {new Date(projectQuery.data.birthdayDate).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric" }
                  )}
                </p>
              )}
              {projectQuery.data.welcomeMessage && (
                <p className="text-sm text-slate-600 mt-3 italic">
                  "{projectQuery.data.welcomeMessage}"
                </p>
              )}
            </Card>

            {/* Tips Card */}
            <Card className="p-6 bg-rose-50 border-rose-200">
              <h4 className="font-semibold text-slate-900 mb-3">
                Tips for a Great Wish
              </h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>Share a favorite memory together</li>
                <li>Include a funny or heartfelt moment</li>
                <li>Express your wishes for the year ahead</li>
                <li>Keep it warm and genuine</li>
                <li>Try the AI Suggest button for inspiration!</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
