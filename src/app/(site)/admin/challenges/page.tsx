"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, CheckCircle2, Clock, Edit2, Eye, FileText, Link2, Plus, Target, Trash2, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAdminChallenges, useAdminSubmissions } from "@/lib/hooks";
import { formatCoins, toDate } from "@/lib/utils";
import type { Challenge, ChallengeStatus, ChallengeSubmission } from "@/types";

export default function AdminChallengesPage() {
  const { data, isLoading, refetch } = useAdminChallenges();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  // Submissions review modal state
  const [reviewChallenge, setReviewChallenge] = useState<Challenge | null>(null);
  const { data: subData, isLoading: subLoading, refetch: refetchSubs } = useAdminSubmissions(reviewChallenge?.id);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [awardCoinsInput, setAwardCoinsInput] = useState<number>(100);

  // Form state
  const [title, setTitle] = useState("");
  const [week, setWeek] = useState(1);
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [coins, setCoins] = useState(100);
  const [xp, setXp] = useState(150);
  const [status, setStatus] = useState<ChallengeStatus>("open");
  const [deadline, setDeadline] = useState("");

  const challenges = data?.challenges ?? [];

  const handleOpenCreate = () => {
    setEditingChallenge(null);
    setTitle("");
    setWeek(challenges.length + 1);
    setDescription("");
    setInstructions("");
    setCoins(100);
    setXp(150);
    setStatus("open");
    setDeadline("");
    setOpen(true);
  };

  const handleOpenEdit = (c: Challenge) => {
    setEditingChallenge(c);
    setTitle(c.title);
    setWeek(c.week);
    setDescription(c.description);
    setInstructions(c.instructions ?? "");
    setCoins(c.coins);
    setXp(c.xp ?? 150);
    setStatus(c.status);
    const dl = toDate(c.deadline);
    setDeadline(dl ? format(dl, "yyyy-MM-dd'T'HH:mm") : "");
    setOpen(true);
  };

  const handleSaveChallenge = async () => {
    if (!title || !deadline) {
      toast.error("Title and deadline are required.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title,
        week: Number(week),
        description,
        instructions,
        resources: editingChallenge?.resources ?? [],
        coins: Number(coins),
        xp: Number(xp),
        status,
        deadline: new Date(deadline).getTime(),
      };

      const url = editingChallenge
        ? `/api/admin/challenges/${editingChallenge.id}`
        : "/api/admin/challenges";
      const method = editingChallenge ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to save challenge.");
      }

      toast.success(editingChallenge ? "Challenge updated!" : "Challenge created!");
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving challenge.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete.");
      toast.success("Challenge deleted.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting challenge.");
    }
  };

  const handleReviewSubmission = async (subId: string, decision: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/submissions/${subId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          feedback: feedbackText || "",
          coins: decision === "approved" ? Number(awardCoinsInput) : 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to review submission.");
      }

      toast.success(`Submission ${decision}!`);
      setReviewingId(null);
      setFeedbackText("");
      refetchSubs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error reviewing submission.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Weekly Challenges</h1>
          <p className="text-muted-foreground">
            Manage weekly assignment tasks and review student submissions.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create Challenge
        </Button>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChallenge ? "Edit Weekly Challenge" : "Create Weekly Challenge"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Week Number</Label>
                <Input
                  type="number"
                  value={week}
                  onChange={(e) => setWeek(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Coins</Label>
                <Input
                  type="number"
                  value={coins}
                  onChange={(e) => setCoins(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>XP Reward</Label>
                <Input
                  type="number"
                  value={xp}
                  onChange={(e) => setXp(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Build an Excel Automation Robot"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief overview..."
                rows={2}
              />
            </div>

            <div>
              <Label>Detailed Instructions</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Step-by-step submission guidelines..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ChallengeStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Deadline *</Label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleSaveChallenge} disabled={saving} className="w-full gap-2">
              {saving ? <Spinner className="text-white" /> : <Target className="h-4 w-4" />}
              {editingChallenge ? "Update Challenge" : "Save Challenge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submissions Review Modal */}
      <Dialog open={Boolean(reviewChallenge)} onOpenChange={(o) => { if (!o) setReviewChallenge(null); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-500" />
              Submissions: {reviewChallenge?.title}
            </DialogTitle>
          </DialogHeader>

          {subLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : !subData?.submissions || subData.submissions.length === 0 ? (
            <EmptyState icon={Clock} title="No submissions yet" description="No students have submitted for this challenge yet." />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Link / Files</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subData.submissions.map((s: ChallengeSubmission) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold">

                        {s.displayName}
                        <div className="text-xs text-muted-foreground">{s.uid}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "approved"
                              ? "default"
                              : s.status === "pending"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.link ? (
                          <a
                            href={s.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-brand-500 hover:underline max-w-[12rem] truncate"
                          >
                            <Link2 className="h-3 w-3 shrink-0" />
                            {s.link}
                          </a>
                        ) : s.fileUrl ? (
                          <a
                            href={s.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            Download Package
                          </a>
                        ) : (
                          "—"
                        )}
                        {s.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                            &ldquo;{s.notes}&rdquo;
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {toDate(s.submittedAt) ? format(toDate(s.submittedAt)!, "PP p") : "—"}
                      </TableCell>

                      <TableCell className="text-right">
                        {s.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewingId(s.id);
                              setAwardCoinsInput(reviewChallenge?.coins ?? 100);
                              setFeedbackText("");
                            }}
                          >
                            Review
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {s.status === "approved" ? `+${s.coinsAwarded} coins` : "Rejected"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Review Drawer when a pending submission is selected */}
              {reviewingId && (
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Review Submission</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Coins to Award</Label>
                      <Input
                        type="number"
                        value={awardCoinsInput}
                        onChange={(e) => setAwardCoinsInput(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Feedback to Student</Label>
                      <Input
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g. Great job on exception handling!"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setReviewingId(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReviewSubmission(reviewingId, "rejected")}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleReviewSubmission(reviewingId, "approved")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve & Award
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Challenges ({challenges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : challenges.length === 0 ? (
            <EmptyState icon={Target} title="No challenges yet" description="Create one to get started." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.map((c) => {
                    const dl = toDate(c.deadline);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-semibold">Week {c.week}</TableCell>
                        <TableCell className="max-w-[16rem]">
                          <div className="truncate font-semibold text-sm" title={c.title}>{c.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {c.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.status}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-amber-500">
                          {formatCoins(c.coins)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dl ? format(dl, "PP p") : "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReviewChallenge(c)}
                            className="gap-1 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> Submissions
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(c)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete challenge ${c.title}`}
                            onClick={() => handleDelete(c.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
