import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Upload, Save, Eye, Globe, Plus, Trash2,
  MoveUp, MoveDown, Music, Wand2, Loader2, GripVertical
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type SectionFormData = {
  id?: number;
  type: "welcome" | "story" | "gallery" | "wishes" | "closing";
  order: number;
  content: string;
  imageUrl: string;
};

type SectionType = SectionFormData["type"];

const SECTION_TYPES: { value: SectionType; label: string; description: string }[] = [
  { value: "welcome", label: "Welcome", description: "A warm welcome message for guests" },
  { value: "story", label: "Story", description: "Share the celebrant's story or memories" },
  { value: "gallery", label: "Gallery", description: "Photo gallery section" },
  { value: "wishes", label: "Wishes", description: "Display approved guest wishes" },
  { value: "closing", label: "Closing", description: "A final thank-you or closing message" },
];

const SPOTIFY_EMBED_URL = (uri: string) => {
  // Support spotify:track:xxx and https://open.spotify.com/track/xxx
  let trackId = uri;
  if (uri.includes("spotify.com/track/")) {
    trackId = uri.split("track/")[1]?.split("?")[0] || "";
  } else if (uri.startsWith("spotify:track:")) {
    trackId = uri.replace("spotify:track:", "");
  }
  return trackId ? `https://open.spotify.com/embed/track/${trackId}` : null;
};

export default function Editor() {
  const { isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const [, navigate] = useLocation();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    celebrantName: "",
    birthdayDate: "",
    welcomeMessage: "",
    coverPhotoUrl: "",
    spotifyUrl: "",
  });
  const [isPublished, setIsPublished] = useState(false);
  const [sections, setSections] = useState<SectionFormData[]>([]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [sectionForm, setSectionForm] = useState<SectionFormData>({
    type: "welcome",
    order: 0,
    content: "",
    imageUrl: "",
  });

  // AI suggestion state
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Get project ID from URL
  useEffect(() => {
    const match = window.location.pathname.match(/\/editor\/(\d+)/);
    if (match) {
      setProjectId(parseInt(match[1]));
    }
  }, []);

  const projectQuery = trpc.projects.get.useQuery(
    { id: projectId || undefined },
    { enabled: isAuthenticated && projectId !== null }
  );

  const sectionsQuery = trpc.sections.list.useQuery(
    { projectId: projectId || 0 },
    { enabled: Boolean(projectId) }
  );

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Keepsake updated!");
      projectQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update keepsake");
    },
  });

  const uploadUrlMutation = trpc.projects.getSignedUploadUrl.useMutation();

  // Section mutations
  const createSectionMutation = trpc.sections.create.useMutation({
    onSuccess: () => {
      toast.success("Section created!");
      sectionsQuery.refetch();
      setShowAddSection(false);
      setEditingSection(null);
      setSectionForm({ type: "welcome", order: 0, content: "", imageUrl: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create section");
    },
  });

  const updateSectionMutation = trpc.sections.update.useMutation({
    onSuccess: () => {
      toast.success("Section updated!");
      sectionsQuery.refetch();
      setEditingSection(null);
      setSectionForm({ type: "welcome", order: 0, content: "", imageUrl: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update section");
    },
  });

  const deleteSectionMutation = trpc.sections.delete.useMutation({
    onSuccess: () => {
      toast.success("Section deleted!");
      sectionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete section");
    },
  });

  // AI suggestion mutation
  const aiSuggestionMutation = trpc.ai.suggestMessage.useMutation({
    onSuccess: (data) => {
      setAiSuggestions(data.suggestions);
      setAiLoading(false);
    },
    onError: (error) => {
      toast.error("Failed to generate suggestions");
      setAiLoading(false);
    },
  });

  useEffect(() => {
    if (projectQuery.data) {
      setFormData({
        celebrantName: projectQuery.data.celebrantName || "",
        birthdayDate: projectQuery.data.birthdayDate
          ? new Date(projectQuery.data.birthdayDate).toISOString().split("T")[0]
          : "",
        welcomeMessage: projectQuery.data.welcomeMessage || "",
        coverPhotoUrl: projectQuery.data.coverPhotoUrl || "",
        spotifyUrl: (projectQuery.data as any).spotifyUrl || "",
      });
      setIsPublished(projectQuery.data.status === "published");
    }
  }, [projectQuery.data]);

  useEffect(() => {
    if (sectionsQuery.data) {
      setSections(sectionsQuery.data.map((s) => ({
        id: s.id,
        type: s.type,
        order: s.order,
        content: s.content || "",
        imageUrl: s.imageUrl || "",
      })));
    }
  }, [sectionsQuery.data]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    await updateProjectMutation.mutateAsync({
      id: projectId,
      celebrantName: formData.celebrantName,
      birthdayDate: new Date(formData.birthdayDate),
      welcomeMessage: formData.welcomeMessage || undefined,
      coverPhotoUrl: formData.coverPhotoUrl || undefined,
    });
  };

  const handlePublish = async () => {
    if (!projectId) return;
    await updateProjectMutation.mutateAsync({
      id: projectId,
      status: isPublished ? "draft" : "published",
    });
    setIsPublished(!isPublished);
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    try {
      const formData_ = new FormData();
      formData_.append("file", file);
      formData_.append("projectId", String(projectId));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData_,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData,
          coverPhotoUrl: data.url,
        });
        toast.success("Cover photo uploaded!");
      } else {
        toast.error("Failed to upload cover photo");
      }
    } catch (error) {
      toast.error("Failed to upload cover photo");
    }
  };

  const handleUploadSectionImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionIdx: number
  ) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    try {
      const formData_ = new FormData();
      formData_.append("file", file);
      formData_.append("projectId", String(projectId));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData_,
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSections = [...sections];
        updatedSections[sectionIdx].imageUrl = data.url;
        setSections(updatedSections);
        toast.success("Image uploaded!");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  // Section management functions
  const handleAddSection = (type: SectionType) => {
    if (!projectId) return;
    const nextOrder = sections.length;
    createSectionMutation.mutate({
      projectId,
      type,
      order: nextOrder,
      content: "",
      imageUrl: "",
    });
  };

  const handleEditSection = (idx: number) => {
    setEditingSection(idx);
    setSectionForm({ ...sections[idx] });
  };

  const handleSaveSection = () => {
    if (!projectId || !editingSection) return;
    const section = sections[editingSection];
    if (!section.id) return;

    updateSectionMutation.mutate({
      id: section.id,
      order: sectionForm.order,
      content: sectionForm.content,
      imageUrl: sectionForm.imageUrl,
    });
  };

  const handleDeleteSection = (id: number) => {
    if (confirm("Are you sure you want to delete this section?")) {
      deleteSectionMutation.mutate({ id });
    }
  };

  const handleMoveSection = (idx: number, direction: "up" | "down") => {
    if (!projectId) return;
    const newSections = [...sections];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    // Swap
    [newSections[idx], newSections[targetIdx]] = [newSections[targetIdx], newSections[idx]];

    // Update orders
    newSections.forEach((s, i) => {
      if (s.id) {
        updateSectionMutation.mutate({ id: s.id, order: i });
      }
    });

    setSections(newSections);
  };

  // AI suggestion handler
  const handleGenerateAISuggestions = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setAiLoading(true);
    try {
      await aiSuggestionMutation.mutateAsync({
        context: aiPrompt,
      });
    } catch {
      setAiLoading(false);
    }
  };

  const handleUseAISuggestion = (suggestion: string) => {
    setFormData({ ...formData, welcomeMessage: suggestion });
    setShowAISuggestion(false);
    toast.success("AI suggestion applied!");
  };

  if (!projectId || projectQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading keepsake...</p>
        </div>
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
              Edit {formData.celebrantName || "Untitled"}'s Keepsake
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePublish}
              disabled={updateProjectMutation.isPending}
            >
              <Globe className="w-4 h-4 mr-2" />
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProjectMutation.isPending}
              className="bg-rose-500 hover:bg-rose-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProjectMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <form onSubmit={handleSave} className="space-y-6">
                {/* Cover Photo */}
                <div>
                  <Label>Cover Photo</Label>
                  <div className="mt-2 relative">
                    {formData.coverPhotoUrl ? (
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <img
                          src={formData.coverPhotoUrl}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="w-6 h-6 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadCover}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="h-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 transition">
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Click to upload cover photo</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadCover}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Celebrant Name */}
                <div>
                  <Label htmlFor="celebrantName">Celebrant's Name</Label>
                  <Input
                    id="celebrantName"
                    value={formData.celebrantName}
                    onChange={(e) =>
                      setFormData({ ...formData, celebrantName: e.target.value })
                    }
                    placeholder="e.g., Sarah"
                  />
                </div>

                {/* Birthday Date */}
                <div>
                  <Label htmlFor="birthdayDate">Birthday Date</Label>
                  <Input
                    id="birthdayDate"
                    type="date"
                    value={formData.birthdayDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthdayDate: e.target.value })
                    }
                  />
                </div>

                {/* Welcome Message with AI Suggestion */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
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
                    id="welcomeMessage"
                    value={formData.welcomeMessage}
                    onChange={(e) =>
                      setFormData({ ...formData, welcomeMessage: e.target.value })
                    }
                    placeholder="A personal message to greet your guests..."
                    rows={4}
                  />
                </div>

                {/* AI Suggestion Panel */}
                {showAISuggestion && (
                  <Card className="p-4 bg-purple-50 border-purple-200">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-purple-800">What kind of welcome message do you want?</Label>
                        <Input
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="e.g., A warm message for my best friend's 25th birthday"
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

                {/* Spotify Integration */}
                <div>
                  <Label htmlFor="spotifyUrl">Spotify Song (Optional)</Label>
                  <Input
                    id="spotifyUrl"
                    value={formData.spotifyUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, spotifyUrl: e.target.value })
                    }
                    placeholder="Paste a Spotify track link (e.g., https://open.spotify.com/track/...)"
                  />
                  {formData.spotifyUrl && SPOTIFY_EMBED_URL(formData.spotifyUrl) && (
                    <div className="mt-3 rounded-lg overflow-hidden">
                      <iframe
                        src={SPOTIFY_EMBED_URL(formData.spotifyUrl)!}
                        width="100%"
                        height="80"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        className="rounded-lg"
                      ></iframe>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Add a song that will play on the published keepsake page. Share any Spotify track link.
                  </p>
                </div>

                {/* Status */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Status</p>
                      <p className="text-sm text-slate-600">
                        {isPublished
                          ? "This keepsake is publicly visible"
                          : "This keepsake is in draft mode"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              </form>
            </Card>

            {/* Sections Management */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Sections</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddSection(!showAddSection)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {showAddSection ? "Cancel" : "Add Section"}
                </Button>
              </div>

              {showAddSection && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {SECTION_TYPES.map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => handleAddSection(st.value)}
                      className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-left"
                    >
                      <p className="font-medium text-sm text-slate-900">{st.label}</p>
                      <p className="text-xs text-slate-500">{st.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {sections.length > 0 ? (
                <div className="space-y-3">
                  {sections.map((section, idx) => (
                    <Card key={section.id || idx} className="p-4">
                      {editingSection === idx ? (
                        <div className="space-y-3">
                          <Label>Content</Label>
                          <Textarea
                            value={sectionForm.content}
                            onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })}
                            rows={3}
                            placeholder="Section content..."
                          />
                          <div className="flex items-center gap-2">
                            <Label>Image (Optional)</Label>
                            <label className="cursor-pointer">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUploadSectionImage(e, idx)}
                                className="hidden"
                              />
                              <Upload className="w-4 h-4 text-slate-500 hover:text-rose-500" />
                            </label>
                          </div>
                          {sectionForm.imageUrl && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-200">
                              <img src={sectionForm.imageUrl} alt="Section" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveSection}
                              className="bg-rose-500 hover:bg-rose-600"
                            >
                              <Save className="w-3 h-3 mr-1" /> Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => { setEditingSection(null); setSectionForm({ type: "welcome", order: 0, content: "", imageUrl: "" }); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, "up")}
                              disabled={idx === 0}
                              className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                            >
                              <MoveUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, "down")}
                              disabled={idx === sections.length - 1}
                              className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                            >
                              <MoveDown className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
                                {SECTION_TYPES.find((st) => st.value === section.type)?.label || section.type}
                              </span>
                              <span className="text-xs text-slate-400">#{idx + 1}</span>
                            </div>
                            {section.content && (
                              <p className="text-sm text-slate-700 line-clamp-2">{section.content}</p>
                            )}
                            {section.imageUrl && (
                              <div className="mt-2 w-16 h-16 rounded overflow-hidden bg-slate-200">
                                <img src={section.imageUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSection(idx)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => section.id && handleDeleteSection(section.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No sections yet. Add sections to structure your keepsake.
                </p>
              )}
            </Card>
          </div>

          {/* Preview & Actions */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Preview</h3>
              <div className="space-y-4">
                {formData.coverPhotoUrl && (
                  <div className="h-32 rounded-lg overflow-hidden bg-slate-200">
                    <img
                      src={formData.coverPhotoUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-600">Celebrant</p>
                  <p className="font-semibold text-slate-900">
                    {formData.celebrantName || "Your Name"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Birthday</p>
                  <p className="font-semibold text-slate-900">
                    {formData.birthdayDate
                      ? new Date(formData.birthdayDate).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>
                {formData.welcomeMessage && (
                  <div>
                    <p className="text-sm text-slate-600">Welcome Message</p>
                    <p className="text-sm text-slate-700 line-clamp-3">
                      {formData.welcomeMessage}
                    </p>
                  </div>
                )}
                {formData.spotifyUrl && SPOTIFY_EMBED_URL(formData.spotifyUrl) && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Song</p>
                    <iframe
                      src={SPOTIFY_EMBED_URL(formData.spotifyUrl)!}
                      width="100%"
                      height="80"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      className="rounded-lg"
                    ></iframe>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-600 mb-2">Sections ({sections.length})</p>
                  <div className="space-y-1">
                    {sections.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                        <GripVertical className="w-3 h-3" />
                        <span>{i + 1}. {SECTION_TYPES.find((st) => st.value === s.type)?.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {projectQuery.data?.publicUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/view/${projectQuery.data!.publicUrl!}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Published Site
                  </Button>
                )}
                {projectQuery.data?.publicUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const url = `${window.location.origin}/contribute/${projectQuery.data!.publicUrl!}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Contribution link copied!");
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Copy Contribution Link
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => projectId && navigate(`/moderation/${projectId}`)}
                >
                  Review Contributions
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
