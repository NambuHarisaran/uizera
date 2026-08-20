"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle,
  Clock,
  Coins,
  ExternalLink,
  FileUp,
  Link2,
  Target,
  Upload,
  XCircle,
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
  pending: { label: "Pending Review", variant: "warning", icon: Clock },
  approved: { label: "Approved", variant: "success", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  open: { label: "Active", variant: "default" },
  closed: { label: "Closed", variant: "secondary" },
};

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

  const handleSubmit = async () => {
    if (!link) {
      toast.error("Please provide a submission link.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          link,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body as { error?: string })?.error ?? "Submission failed.");
      }
      toast.success(existing ? "Submission updated!" : "Challenge submitted!");
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
        <Button variant={existing ? "outline" : "default"} size={existing ? "sm" : "default"} className="gap-2">
          <Upload className="h-4 w-4" /> {existing ? "Update Submission" : "Submit"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Update Submission" : "Submit"}: {challenge.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="link">Submission Link *</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://github.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Anything you'd like the reviewer to know..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Spinner className="text-white" /> : existing ? "Save Changes" : "Submit Challenge"}
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
  const cfg = statusConfig[challenge.status] ?? statusConfig.open;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:border-brand-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
              <Coins className="h-4 w-4" />
              {formatCoins(challenge.coins)} coins
            </div>
          </div>
          <CardTitle className="mt-2 text-lg">{challenge.title}</CardTitle>
          <CardDescription className="line-clamp-3">
            {challenge.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
          {/* Metadata */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Deadline: {dl ? format(dl, "PPp") : "—"}
            </div>

            {challenge.resources && challenge.resources.length > 0 && (
              <div className="space-y-1">
                <span className="font-medium text-foreground">Resources:</span>
                <div className="flex flex-wrap gap-1.5">
                  {challenge.resources.map((r, i) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-brand-500 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {r.label || (r as any).title || "Resource"}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission status */}
          {submission ? (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Your Submission</h4>
                {(() => {
                  const cfg = submissionStatusConfig[submission.status];
                  const Icon = cfg.icon;
                  return (
                    <Badge variant={cfg.variant as any} className={cfg.color}>
                      <Icon className="mr-1 h-3 w-3" />
                      {cfg.label}
                    </Badge>
                  );
                })()}
              </div>
              {submission.link && (
                <a
                  href={submission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1.5 text-sm text-brand-500 hover:underline"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  View submission
                </a>
              )}
              {submission.feedback && (
                <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                  <p className="mb-1 text-xs font-medium">Feedback:</p>
                  {submission.feedback}
                </div>
              )}
              {submission.coinsAwarded > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-amber-500">
                  <Coins className="h-3.5 w-3.5" />
                  {formatCoins(submission.coinsAwarded)} coins awarded
                </p>
              )}
              {submission.status !== "approved" && isOpen && (
                <div className="mt-4 pt-3 border-t">
                  <SubmitDialog challenge={challenge} existing={submission} onSuccess={onSubmit} />
                </div>
              )}
            </div>
          ) : isOpen ? (
            <SubmitDialog challenge={challenge} onSuccess={onSubmit} />
          ) : (
            <p className="text-sm text-muted-foreground">Submissions are closed for this challenge.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ChallengesContent() {
  const { data, isLoading, refetch } = useChallenges();

  const challenges = (data?.challenges ?? []) as Challenge[];
  const submissions = (data?.submissions ?? []) as ChallengeSubmission[];
  const subMap = new Map(submissions.map((s) => [s.challengeId, s]));

  return (
    <div className="pb-24">
      <section className="hero-glow relative overflow-hidden py-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
              <Target className="h-4 w-4" />
              Weekly Challenges
            </div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Push Your <span className="text-gradient">Limits</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Complete hands-on automation challenges, get expert feedback, and earn coins.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-3xl py-16">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : challenges.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No challenges yet"
            description="Weekly challenges will appear here when admins create them."
          />
        ) : (
          <div className="space-y-6">
            {challenges.map((c) => (
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
  );
}
