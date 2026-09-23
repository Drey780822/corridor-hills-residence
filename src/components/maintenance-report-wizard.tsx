import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  FileImage,
  ImageIcon,
  Loader2,
  Trash2,
  Wrench,
  Zap,
  Droplets,
  Bed,
  KeyRound,
  SunMedium,
  Bath,
  UtensilsCrossed,
  LayoutGrid,
  Sparkles,
  HelpCircle,
  Clock,
  WifiOff,
  Save,
  Info,
} from "lucide-react";
import {
  MAINTENANCE_CATEGORIES,
  PROBLEM_AREAS,
  getCategoryMeta,
  getIssueTypes,
} from "../lib/categories-config";
import {
  clearOfflineDraft,
  getOfflineDraft,
  queueOutboxReport,
  saveOfflineDraft,
  submitMaintenanceReport,
} from "../lib/maintenance-service";
import { useOnlineStatus } from "../hooks/use-online-status";
import type {
  MaintenanceCategory,
  MaintenanceRequest,
  OfflineDraft,
  ProblemArea,
  ResidentSession,
} from "../types/residence";
import { toast } from "sonner";

interface MaintenanceReportWizardProps {
  session: ResidentSession;
}

// Map Lucide icons dynamically to avoid huge bundles
function CategoryIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "Zap":
      return <Zap className={className} />;
    case "Droplets":
      return <Droplets className={className} />;
    case "Bed":
      return <Bed className={className} />;
    case "KeyRound":
      return <KeyRound className={className} />;
    case "SunMedium":
      return <SunMedium className={className} />;
    case "Bath":
      return <Bath className={className} />;
    case "UtensilsCrossed":
      return <UtensilsCrossed className={className} />;
    case "LayoutGrid":
      return <LayoutGrid className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
}

interface LocalAttachmentPreview {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  progress: number;
  error?: string;
}

export function MaintenanceReportWizard({ session }: MaintenanceReportWizardProps) {
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();

  // Wizard steps: 1 = Area, 2 = Category, 3 = Issue Type, 4 = Description, 5 = Evidence, 6 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form State
  const [idempotencyKey] = useState<string>(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `key-${Date.now()}-${Math.random()}`,
  );
  const [selectedArea, setSelectedArea] = useState<ProblemArea>("My Room");
  const [selectedCategory, setSelectedCategory] = useState<MaintenanceCategory | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [attachments, setAttachments] = useState<LocalAttachmentPreview[]>([]);

  // Submission / Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<MaintenanceRequest | null>(null);
  const [isSavedOffline, setIsSavedOffline] = useState(false);

  // Hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Check for saved local draft on mount
  useEffect(() => {
    const draft = getOfflineDraft();
    if (draft && draft.unit === session.unit) {
      toast("Unsubmitted draft found", {
        description: "Would you like to restore your previous report?",
        action: {
          label: "Restore",
          onClick: () => {
            if (draft.area) setSelectedArea(draft.area);
            if (draft.category) setSelectedCategory(draft.category);
            if (draft.issueType) setSelectedIssueType(draft.issueType);
            if (draft.description) setDescription(draft.description);
            if (draft.attachments) {
              setAttachments(
                draft.attachments.map((a, i) => ({
                  id: `restored-${i}`,
                  name: a.name,
                  size: a.size,
                  type: a.type,
                  dataUrl: a.dataUrl,
                  progress: 100,
                })),
              );
            }
            toast.success("Draft restored");
          },
        },
      });
    }
  }, [session.unit]);

  // Auto-save draft as user progresses
  const handleAutoSaveDraft = () => {
    const draft: OfflineDraft = {
      idempotencyKey,
      unit: session.unit,
      room: session.room,
      area: selectedArea,
      category: selectedCategory || undefined,
      issueType: selectedIssueType || undefined,
      description: description || undefined,
      attachments: attachments.map((a) => ({
        name: a.name,
        size: a.size,
        type: a.type,
        dataUrl: a.dataUrl,
      })),
      savedAt: new Date().toISOString(),
      syncStatus: "draft",
    };
    saveOfflineDraft(draft);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const validFiles = Array.from(files).slice(0, 5); // Max 5 attachments

    validFiles.forEach((file) => {
      if (file.size > maxFileSize) {
        toast.error(`${file.name} is too large. Max size is 10MB.`);
        return;
      }

      const reader = new FileReader();
      const tempId = `att-${Date.now()}-${Math.random()}`;

      // Insert placeholder with progress
      setAttachments((prev) => [
        ...prev,
        {
          id: tempId,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: "",
          progress: 30,
        },
      ]);

      reader.onload = () => {
        setAttachments((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  dataUrl: reader.result as string,
                  progress: 100,
                }
              : item,
          ),
        );
        handleAutoSaveDraft();
      };

      reader.onerror = () => {
        setAttachments((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? { ...item, error: "Failed to read file. Please try again." }
              : item,
          ),
        );
      };

      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    handleAutoSaveDraft();
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !selectedIssueType || !description.trim()) {
      toast.error("Please fill in all required fields before submitting.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      idempotencyKey,
      area: selectedArea,
      category: selectedCategory,
      issueType: selectedIssueType,
      description: description.trim(),
      attachments: attachments.map((a) => ({
        name: a.name,
        size: a.size,
        type: a.type,
        dataUrl: a.dataUrl,
      })),
    };

    if (!isOnline) {
      // Offline submission
      queueOutboxReport(payload, session);
      setIsSavedOffline(true);
      setIsSubmitting(false);
      clearOfflineDraft();
      return;
    }

    try {
      const created = await submitMaintenanceReport(payload, session);
      setSubmittedRequest(created);
      clearOfflineDraft();
      toast.success("Maintenance report submitted successfully!");
    } catch {
      toast.error("Failed to submit maintenance report. Saved as draft on this device.");
      queueOutboxReport(payload, session);
      setIsSavedOffline(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS STATE (Online Submission)
  if (submittedRequest) {
    return (
      <div className="overflow-hidden rounded-2xl border border-teal-500/30 bg-card p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <div className="mt-5 text-center">
          <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Report Logged
          </span>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Your issue has been reported.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Our automated maintenance routing system has received your report and placed it in the
            priority queue.
          </p>
        </div>

        {/* Reference details box */}
        <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-4 text-left sm:grid-cols-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Reference
              </span>
              <p className="font-mono text-base font-bold text-foreground">{submittedRequest.id}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Location
              </span>
              <p className="text-base font-bold text-foreground">{submittedRequest.location}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Current Status
              </span>
              <div className="flex items-center gap-1.5 font-bold text-teal-600 dark:text-teal-400">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                <span>{submittedRequest.status === "assigned" ? "Assigned" : "Submitted"}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-border/80 pt-3 text-xs text-muted-foreground">
            <strong>Category:</strong> {submittedRequest.category} • <strong>Issue:</strong>{" "}
            {submittedRequest.issueType}
            {submittedRequest.assignedTechnician && (
              <div className="mt-1.5 font-medium text-foreground">
                Assigned Specialist: {submittedRequest.assignedTechnician.name} (
                {submittedRequest.assignedTechnician.specialty})
              </div>
            )}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate({ to: "/requests" })}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 font-bold text-white shadow-md transition-all active:scale-95 hover:bg-teal-700"
          >
            <span>Track Request</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-6 font-bold text-foreground transition-all hover:bg-accent"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // OFFLINE PRESERVED STATE
  if (isSavedOffline) {
    return (
      <div className="overflow-hidden rounded-2xl border border-amber-500/40 bg-card p-6 shadow-2xl sm:p-8 animate-in fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <WifiOff className="h-9 w-9" />
        </div>

        <div className="mt-5 text-center">
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Saved Offline
          </span>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            You&apos;re offline. Your report is safely stored.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Your maintenance report has been preserved securely on this device. As soon as your
            internet connection is restored, it will automatically submit to the residence system.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Save className="h-4 w-4 text-amber-500" />
            <span>Draft and attachments safely stored in local browser cache.</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate({ to: "/requests" })}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-md transition-all active:scale-95 hover:bg-primary/90"
          >
            <span>View My Requests</span>
          </button>
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-6 font-bold text-foreground transition-all hover:bg-accent"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const issueTypesForSelectedCat = selectedCategory ? getIssueTypes(selectedCategory) : [];
  const selectedCatMeta = selectedCategory ? getCategoryMeta(selectedCategory) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      {/* Wizard Step Header */}
      <div className="border-b border-border bg-muted/30 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <Wrench className="h-4 w-4" />
            Step {currentStep} of 6
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <span>Location:</span>
            <span className="rounded-md bg-background px-2 py-0.5 font-mono text-foreground border border-border">
              {session.location}
            </span>
          </div>
        </div>

        {/* Step Titles */}
        <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {currentStep === 1 && "Where is the problem?"}
          {currentStep === 2 && "Choose an issue category"}
          {currentStep === 3 && `Select specific issue in ${selectedCategory}`}
          {currentStep === 4 && "Tell us what happened"}
          {currentStep === 5 && "Add photo or video evidence"}
          {currentStep === 6 && "Review your maintenance report"}
        </h2>

        {/* Progress bar */}
        <div className="mt-4 flex gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((st) => (
            <div
              key={st}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                currentStep >= st ? "bg-teal-500" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Wizard Step Body */}
      <div className="p-5 sm:p-6">
        {/* STEP 1: PROBLEM AREA */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Verified Resident: </span>
              Unit <strong className="text-foreground">{session.unit}</strong> • Room{" "}
              <strong className="text-foreground">{session.room}</strong> ({session.location})
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Affected Area
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PROBLEM_AREAS.map((area) => {
                const isSelected = selectedArea === area;
                const isRoom = area === "My Room";
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      setSelectedArea(area);
                      handleAutoSaveDraft();
                    }}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${
                      isSelected
                        ? "border-teal-500 bg-teal-500/10 text-teal-700 ring-2 ring-teal-500/20 dark:text-teal-300"
                        : "border-border bg-background hover:border-teal-500/40 hover:bg-muted/30"
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-foreground">{area}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isRoom
                          ? `Inside your private room (${session.location})`
                          : `Shared in unit ${session.unit}`}
                      </p>
                    </div>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-teal-500 bg-teal-500 text-white"
                          : "border-muted-foreground/30 bg-transparent"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORY */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Category
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MAINTENANCE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedIssueType("");
                      handleAutoSaveDraft();
                    }}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all active:scale-[0.98] sm:p-4 ${
                      isSelected
                        ? "border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/20"
                        : "border-border bg-background hover:border-teal-500/40 hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isSelected ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <CategoryIcon name={cat.iconName} className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-foreground">{cat.label}</h3>
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                      {cat.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: ISSUE TYPE */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
              <span>Category:</span>
              <strong className="font-semibold text-foreground">{selectedCatMeta?.label}</strong>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              What specific problem are you experiencing?
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {issueTypesForSelectedCat.map((issue) => {
                const isSelected = selectedIssueType === issue.label;
                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => {
                      setSelectedIssueType(issue.label);
                      if (!description && issue.defaultDescriptionPlaceholder) {
                        // Helpful suggestion
                      }
                      handleAutoSaveDraft();
                    }}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                      isSelected
                        ? "border-teal-500 bg-teal-500/10 text-teal-700 ring-2 ring-teal-500/20 dark:text-teal-300"
                        : "border-border bg-background hover:border-teal-500/40 hover:bg-muted/30"
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{issue.label}</h3>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/80">
                        {issue.skillRequired} technician
                      </span>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 ${
                        isSelected ? "text-teal-500" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: DESCRIPTION */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
              <span>Selected: </span>
              <strong className="text-foreground">
                {selectedCategory} &gt; {selectedIssueType}
              </strong>
            </div>

            <div>
              <label
                htmlFor="issue-description"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Describe the issue
              </label>
              <textarea
                id="issue-description"
                rows={5}
                placeholder="e.g. The sink is blocked and water is not draining properly. We tried clearing it but water still backs up."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  handleAutoSaveDraft();
                }}
                autoFocus
                className="mt-2 w-full rounded-xl border border-input bg-background p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Please describe where it is located and any signs (leaks, noise, smell, or hazards).
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: EVIDENCE UPLOAD */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Photo / Video Evidence (Optional but Recommended)
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Attaching photos helps our technicians arrive with the correct spare parts and
                tools.
              </p>
            </div>

            {/* Mobile-first Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-500/40 bg-teal-500/5 p-4 text-center transition-all hover:bg-teal-500/10 active:scale-95"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-500 text-white shadow-sm">
                  <Camera className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-foreground">Take Photo</span>
                <span className="text-[10px] text-muted-foreground">Camera capture</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 p-4 text-center transition-all hover:bg-accent active:scale-95"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-foreground">Upload from Gallery</span>
                <span className="text-[10px] text-muted-foreground">Photos & videos</span>
              </button>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            {/* Attachments list / grid */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Attached files ({attachments.length}/5):
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background p-2.5 shadow-sm"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {att.dataUrl && att.type.startsWith("image") ? (
                          <img
                            src={att.dataUrl}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <FileImage className="h-5 w-5" />
                          </div>
                        )}
                        <div className="truncate text-left">
                          <p className="truncate text-xs font-bold text-foreground">{att.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {(att.size / 1024).toFixed(0)} KB
                          </p>
                          {att.progress < 100 && (
                            <div className="mt-1 h-1 w-24 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-teal-500 transition-all"
                                style={{ width: `${att.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                        title="Remove photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: REVIEW */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="grid grid-cols-2 gap-4 text-left sm:grid-cols-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Location
                  </span>
                  <p className="font-bold text-foreground">
                    {selectedArea === "My Room"
                      ? session.location
                      : `${session.unit} (${selectedArea})`}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Area
                  </span>
                  <p className="font-bold text-foreground">{selectedArea}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Category
                  </span>
                  <p className="font-bold text-foreground">{selectedCategory}</p>
                </div>
                <div className="col-span-2 sm:col-span-3 border-t border-border pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Issue Type
                  </span>
                  <p className="font-bold text-foreground">{selectedIssueType}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {description}
              </p>
            </div>

            {attachments.length > 0 && (
              <div className="rounded-xl border border-border bg-background p-4 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Evidence Attached
                </span>
                <p className="mt-1 text-xs font-semibold text-foreground">
                  {attachments.length} photo(s) attached
                </p>
                <div className="mt-2 flex gap-2 overflow-x-auto py-1">
                  {attachments.map((att) => (
                    <img
                      key={att.id}
                      src={att.dataUrl}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover border border-border shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}

            {!isOnline && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <Info className="h-4 w-4 shrink-0" />
                <span>
                  You are currently offline. Your report will be safely kept in local storage and
                  submitted when connection returns.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky / Mobile-Friendly Footer Controls */}
      <div className="flex items-center justify-between border-t border-border bg-muted/20 p-4 sm:p-5">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4 | 5 | 6)}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-background px-4 text-xs font-bold text-foreground transition-colors hover:bg-accent active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep < 6 ? (
          <button
            type="button"
            onClick={() => {
              if (currentStep === 1 && !selectedArea) {
                toast.error("Please select an affected area.");
                return;
              }
              if (currentStep === 2 && !selectedCategory) {
                toast.error("Please select an issue category.");
                return;
              }
              if (currentStep === 3 && !selectedIssueType) {
                toast.error("Please select a specific issue type.");
                return;
              }
              if (currentStep === 4 && !description.trim()) {
                toast.error("Please describe what happened.");
                return;
              }
              setCurrentStep((prev) => Math.min(6, prev + 1) as 1 | 2 | 3 | 4 | 5 | 6);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-bold text-white transition-all active:scale-95 hover:bg-teal-700 shadow-sm"
          >
            <span>Continue</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-7 text-sm font-bold text-white transition-all active:scale-95 hover:bg-teal-700 shadow-md disabled:pointer-events-none disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting Report...</span>
              </>
            ) : (
              <>
                <span>Submit Report</span>
                <CheckCircle2 className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
