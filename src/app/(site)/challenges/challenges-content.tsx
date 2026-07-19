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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useChallenges } from "@/lib/hooks";
import { formatCoins, toDate } from "@/lib/utils";
import type { Challenge, ChallengeSubmission, SubmissionStatus } from "@/types";

const submissionStatusConfig: Record<SubmissionStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: "Pending Review", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

function SubmitDialog({ challenge, onSuccess }: { challenge: Challenge; onSuccess: () => void }) {
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
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
      toast.success("Challenge submitted!");
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
        <Button className="gap-2">
          <Upload className="h-4 w-4" /> Submit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit: {challenge.title}</DialogTitle>
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
          <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
            {submitting ? <Spinner className="text-white" /> : <FileUp className="h-4 w-4" />}
            Submit Challenge
          </Button>
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
  const deadline = toDate(challenge.deadline);
  const isPast = deadline ? deadline.getTime() < Date.now() : false;
  const isOpen = challenge.status === "open" && !isPast;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Card className="transition-all duration-300 hover:border-brand-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Week {challenge.week}</Badge>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-500">
              <Coins className="h-4 w-4" />
              {formatCoins(challenge.coins)} coins
            </div>
          </div>
          <CardTitle className="text-xl">{challenge.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenge.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{challenge.description}</p>
          )}

          {challenge.instructions && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="mb-2 text-sm font-semibold">Instructions</h4>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{challenge.instructions}</p>
            </div>
          )}

          {challenge.resources.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Resources</h4>
              <div className="space-y-1">
                {challenge.resources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-brand-500 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {r.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {deadline && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Deadline: {format(deadline, "PPp")}
              </span>
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
                    <Badge className={cfg.color}>
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
