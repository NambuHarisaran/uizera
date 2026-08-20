"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Coins,
  ExternalLink,
  FileCode,
  FileUp,
  Filter,
  Flame,
  Globe,
  HelpCircle,
  Info,
  Link2,
  Lock,
  Search,
  Sparkles,
  Target,
  Upload,
  Video,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useChallenges } from "@/lib/hooks";
import { formatCoins, toDate } from "@/lib/utils";
import type { Challenge, ChallengeSubmission, SubmissionStatus } from "@/types";

const submissionStatusConfig: Record<
  SubmissionStatus,
  { label: string; variant?: "warning" | "success" | "outline" | "default" | "secondary" | "destructive"; color?: string; icon: typeof CheckCircle }
> = {
  pending: { label: "Under Review", variant: "warning", icon: Clock },
  approved: { label: "Approved & Rewarded", variant: "success", icon: CheckCircle },
  rejected: { label: "Needs Revision", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

function getChallengeDifficulty(coins: number, week: number) {
  if (coins <= 100 || week <= 2) {
    return {
      label: "Beginner",
      badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      dotClass: "bg-emerald-500",
    };
  }
  if (coins <= 250 || week <= 5) {
    return {
      label: "Intermediate",
      badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
      dotClass: "bg-sky-500",
    };
  }
  if (coins <= 500) {
    return {
      label: "Advanced",
      badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
      dotClass: "bg-purple-500",
    };
  }
  return {
    label: "Expert",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500",
  };
}

function getDeadlinePill(dl: Date | null, isOpen: boolean) {
  if (!dl) return { label: "No deadline", color: "bg-muted text-muted-foreground" };
  const now = new Date();
  if (now > dl || !isOpen) {
    return { label: "Closed", color: "bg-muted text-muted-foreground", icon: Lock };
  }

  const daysLeft = differenceInDays(dl, now);
  const hoursLeft = differenceInHours(dl, now);

  if (daysLeft >= 2) {
    return {
      label: `${daysLeft} days left`,
      color: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
      icon: Clock,
    };
  }
  if (hoursLeft >= 1) {
    return {
      label: `Ends in ${hoursLeft}h`,
      color: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse",
      icon: Flame,
    };
  }
  const minsLeft = Math.max(1, differenceInMinutes(dl, now));
  return {
    label: `${minsLeft}m left!`,
    color: "border-red-500/40 bg-red-500/10 text-red-500 font-bold animate-pulse",
    icon: Flame,
  };
}

function getUrlPreviewInfo(url: string) {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("github.com")) {
    return { label: "GitHub Repository", icon: FileCode, color: "text-purple-500" };
  }
  if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) {
    return { label: "Google Drive Folder/Doc", icon: Globe, color: "text-blue-500" };
  }
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return { label: "YouTube Demo Video", icon: Video, color: "text-red-500" };
  }
  return { label: "External Project Link", icon: Link2, color: "text-brand-500" };
}

function SubmitDialog({
  challenge,
  existing,
  onSuccess,
}: {
  challenge: Challenge;
  existing?: ChallengeSubmission;
  onSuccess: () => void;
}) {
  const [link, setLink] = useState(existing?.link ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const isValidUrl = link.trim().startsWith("http://") || link.trim().startsWith("https://");
  const urlInfo = getUrlPreviewInfo(link);

  const handleSubmit = async () => {
    if (!link.trim()) {
      toast.error("Please provide a submission link.");
      return;
    }
    if (!isValidUrl) {
      toast.error("Please provide a valid URL starting with http:// or https://");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          link: link.trim(),
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body as { error?: string })?.error ?? "Submission failed.");
      }
      toast.success(existing ? "Submission updated!" : "Challenge submitted for review! 🎉");
      setOpen(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={existing ? "outline" : "default"}
          size={existing ? "sm" : "default"}
          className={`gap-2 rounded-xl font-bold shadow-sm ${
            !existing ? "bg-brand-500 hover:bg-brand-600" : "border-brand-500/40 text-brand-600 dark:text-brand-400"
          }`}
        >
          <Upload className="h-4 w-4" /> {existing ? "Update Submission" : "Submit Solution"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-brand-500">
            <Target className="h-4 w-4" /> Challenge Week #{challenge.week}
          </div>
          <DialogTitle className="text-xl font-bold font-display">
            {existing ? "Update Submission" : "Submit Solution"}: {challenge.title}
          </DialogTitle>
        </DialogHeader>

        {/* Instructions callout */}
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-3.5 text-xs text-muted-foreground leading-relaxed space-y-1.5">
          <p className="font-bold text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-brand-500" /> Submission Guidelines
          </p>
          <p>
            Provide a public link to your project (e.g. GitHub repository containing your .xaml files, Google Drive folder, or video demo). Ensure reviewer permissions are public.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="link" className="text-xs font-bold">
              Project Link <span className="text-destructive">*</span>
            </Label>
            <Input
              id="link"
              type="url"
              placeholder="https://github.com/username/uipath-challenge"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="rounded-xl h-10"
            />
            {link && (
              <div className="flex items-center justify-between text-xs pt-1">
                {urlInfo ? (
                  <span className={`inline-flex items-center gap-1 font-semibold ${urlInfo.color}`}>
                    <urlInfo.icon className="h-3.5 w-3.5" /> {urlInfo.label}
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Please include https://
                  </span>
                )}
                <a
                  href={isValidUrl ? link : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-brand-500 hover:underline flex items-center gap-0.5 ${
                    !isValidUrl ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Test Link <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes" className="text-xs font-bold">
                Notes for Reviewer (optional)
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {notes.length}/500
              </span>
            </div>
            <Textarea
              id="notes"
              rows={3}
              maxLength={500}
              placeholder="Explain your approach, packages used, or any notes on running the automation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl resize-none text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !link.trim() || !isValidUrl}
              className="gap-2 bg-brand-500 hover:bg-brand-600 font-bold rounded-xl shadow-md"
            >
              {submitting ? <Spinner className="text-white" /> : <Sparkles className="h-4 w-4" />}
              {submitting ? "Submitting…" : existing ? "Save Changes" : "Submit Challenge"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChallengeCard({
  challenge,
  submission,
  onSubmit,
}: {
  challenge: Challenge;
  submission?: ChallengeSubmission;
  onSubmit: () => void;
}) {
  const dl = toDate(challenge.deadline);
  const isOpen = challenge.status === "open" && Boolean(dl && Date.now() < dl.getTime());
  const diff = getChallengeDifficulty(challenge.coins, challenge.week);
  const dlPill = getDeadlinePill(dl, isOpen);
  const DlIcon = dlPill.icon ?? Clock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:border-brand-500/40 overflow-hidden">
        {/* Top Header Strip */}
        <div className="border-b bg-muted/30 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono bg-card text-foreground font-bold">
              Week {challenge.week}
            </Badge>
            <Badge variant="outline" className={diff.badgeClass}>
              <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${diff.dotClass}`} />
              {diff.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${dlPill.color} gap-1 font-semibold`}>
              <DlIcon className="h-3 w-3" />
              {dlPill.label}
            </Badge>
            <span className="inline-flex items-center gap-1 font-bold text-amber-500">
              <Coins className="h-3.5 w-3.5" />
              +{formatCoins(challenge.coins)} coins
            </span>
          </div>
        </div>

        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold font-display leading-snug">
            {challenge.title}
          </CardTitle>
          <CardDescription className="line-clamp-3 text-sm leading-relaxed mt-1">
            {challenge.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-1">
          {/* Metadata & Resources */}
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-brand-500" />
              <span>Deadline: <strong className="text-foreground">{dl ? format(dl, "PPp") : "—"}</strong></span>
            </div>

            {challenge.resources && challenge.resources.length > 0 && (
              <div className="space-y-1.5 rounded-xl border bg-muted/20 p-3">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-brand-500" /> Starter Materials & Resources:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {challenge.resources.map((r, i) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs font-semibold text-brand-500 hover:text-brand-600 hover:border-brand-500/40 transition-colors shadow-2xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {r.label || (r as any).title || "Resource Link"}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission Status Box */}
          {submission ? (
            <div className="rounded-2xl border-2 p-4 bg-card/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Your Submission
                </h4>
                {(() => {
                  const cfg = submissionStatusConfig[submission.status];
                  const Icon = cfg.icon;
                  return (
                    <Badge variant={cfg.variant as any} className={`${cfg.color} gap-1 font-bold`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>
                  );
                })()}
              </div>

              {submission.link && (
                <div className="flex items-center justify-between text-xs rounded-xl border bg-muted/40 p-2.5">
                  <a
                    href={submission.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-semibold text-brand-500 hover:underline truncate"
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{submission.link}</span>
                  </a>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-2" />
                </div>
              )}

              {submission.feedback && (
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs text-muted-foreground">
                  <p className="mb-1 text-xs font-bold text-foreground flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-brand-500" /> Reviewer Feedback:
                  </p>
                  <p className="leading-relaxed">{submission.feedback}</p>
                </div>
              )}

              {submission.coinsAwarded > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Coins className="h-4 w-4" />
                  <span>+{formatCoins(submission.coinsAwarded)} coins awarded to your balance!</span>
                </div>
              )}

              {submission.status !== "approved" && isOpen && (
                <div className="pt-2 border-t flex justify-end">
                  <SubmitDialog challenge={challenge} existing={submission} onSuccess={onSubmit} />
                </div>
              )}
            </div>
          ) : isOpen ? (
            <div className="pt-2">
              <SubmitDialog challenge={challenge} onSuccess={onSubmit} />
            </div>
          ) : (
            <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Submissions are closed for this challenge.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ChallengesContent() {
  const { data, isLoading, refetch } = useChallenges();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "open" | "submitted" | "approved">("all");

  const challenges = (data?.challenges ?? []) as Challenge[];
  const submissions = (data?.submissions ?? []) as ChallengeSubmission[];
  const subMap = useMemo(() => new Map(submissions.map((s) => [s.challengeId, s])), [submissions]);

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      const dl = toDate(c.deadline);
      const isOpen = c.status === "open" && Boolean(dl && Date.now() < dl.getTime());
      const sub = subMap.get(c.id);

      if (!matchesSearch) return false;
      if (filterTab === "open") return isOpen;
      if (filterTab === "submitted") return Boolean(sub);
      if (filterTab === "approved") return sub?.status === "approved";
      return true;
    });
  }, [challenges, searchQuery, filterTab, subMap]);

  const openCount = challenges.filter((c) => {
    const dl = toDate(c.deadline);
    return c.status === "open" && Boolean(dl && Date.now() < dl.getTime());
  }).length;
  const mySubCount = submissions.length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;

  return (
    <div className="pb-24">
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="hero-glow relative overflow-hidden py-20">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
              <Target className="h-4 w-4" />
              Hands-On Automation Challenges
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              Push Your <span className="text-gradient">Automation Limits</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Complete weekly UiPath projects, get detailed reviewer feedback, and earn massive coin bonuses.
            </p>

            {/* Quick Stats Strip */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 backdrop-blur-md shadow-sm">
                <Flame className="h-4 w-4 text-uipath-orange" />
                <span>{openCount} Active Challenges</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 backdrop-blur-md shadow-sm">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{approvedCount} Completed by You</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Control Bar & Challenges List ───────────────────────────────── */}
      <div className="container max-w-4xl py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                filterTab === "all"
                  ? "bg-brand-500 text-white shadow-md"
                  : "border bg-card hover:bg-accent text-muted-foreground"
              }`}
            >
              All Challenges
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {challenges.length}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("open")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                filterTab === "open"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "border bg-card hover:bg-accent text-muted-foreground"
              }`}
            >
              Active / Open
              {openCount > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0 text-[10px]">
                  {openCount}
                </Badge>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("submitted")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                filterTab === "submitted"
                  ? "bg-sky-600 text-white shadow-md"
                  : "border bg-card hover:bg-accent text-muted-foreground"
              }`}
            >
              My Submissions
              {mySubCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {mySubCount}
                </Badge>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("approved")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                filterTab === "approved"
                  ? "bg-amber-600 text-white shadow-md"
                  : "border bg-card hover:bg-accent text-muted-foreground"
              }`}
            >
              Approved
              {approvedCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {approvedCount}
                </Badge>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-10 rounded-xl text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Cards List ───────────────────────────────────────────────── */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner className="h-9 w-9 text-brand-500" />
              <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                Loading weekly challenges...
              </p>
            </div>
          ) : challenges.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No challenges available yet"
              description="Weekly challenges will appear here when published. Stay tuned for new RPA project tasks!"
            />
          ) : filteredChallenges.length === 0 ? (
            <div className="py-16 text-center space-y-4 rounded-2xl border border-dashed p-8 bg-card/50">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold">No matching challenges found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No challenges match your active filter or search query.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterTab("all");
                }}
                className="gap-2"
              >
                <X className="h-3.5 w-3.5" /> Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1">
              {filteredChallenges.map((c) => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  submission={subMap.get(c.id)}
                  onSubmit={() => void refetch()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

