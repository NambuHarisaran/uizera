"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Coins,
  Crown,
  Pencil,
  Plus,
  Radio,
  Sparkles,
  Trash2,
  UserCheck,
  Wand2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/shared/spinner";
import { AIQuizModal, type AIQuestion } from "@/components/admin/ai-quiz-modal";
import { useAdminQuizzes } from "@/lib/hooks";
import { formatCoins, formatDuration, toDate } from "@/lib/utils";
import type { Quiz, QuizStatus, QuestionType } from "@/types";

interface QuestionInput {
  id?: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctIndices: number[];
  explanation?: string | null;
  points: number;
}

interface QuizSettings {
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showReview: boolean;
  maxAttempts: number;
}

const DEFAULT_SETTINGS: QuizSettings = {
  randomizeQuestions: true,
  randomizeOptions: true,
  showReview: true,
  maxAttempts: 1,
};

const DEFAULT_QUESTION: QuestionInput = {
  type: "mcq",
  prompt: "What is UiPath Studio?",
  options: ["IDE for Automation", "Database engine", "Web browser", "Operating System"],
  correctIndices: [0],
  points: 10,
};

/** Epoch millis (or Firestore timestamp) → value for <input type="datetime-local">. */
function toLocalInput(ts: unknown): string {
  const d = toDate(ts as never);
  return d ? format(d, "yyyy-MM-dd'T'HH:mm") : "";
}

import { useRouter } from "next/navigation";

export default function AdminQuizzesPage() {
  const router = useRouter();
  const { data, isLoading, refetch } = useAdminQuizzes();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  // Assign Host dialog state
  const [assignHostOpen, setAssignHostOpen] = useState(false);
  const [assignHostQuizId, setAssignHostQuizId] = useState<string | null>(null);
  const [assignHostInput, setAssignHostInput] = useState("");
  const [assignHostSaving, setAssignHostSaving] = useState(false);
  const [assignHostCurrentName, setAssignHostCurrentName] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"async" | "live">("async");
  const [status, setStatus] = useState<QuizStatus>("draft");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(600);
  const [coinsPerPoint, setCoinsPerPoint] = useState(1);
  const [xpReward, setXpReward] = useState(100);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [questions, setQuestions] = useState<QuestionInput[]>([DEFAULT_QUESTION]);

  const quizzes = data?.quizzes ?? [];

  const handleApplyAiQuiz = (aiData: {
    title?: string;
    description?: string;
    questions: AIQuestion[];
    append: boolean;
  }) => {
    if (aiData.title && (!title || !editingId)) setTitle(aiData.title);
    if (aiData.description && (!description || !editingId)) setDescription(aiData.description);

    // If dates are not set yet, set default start (now) and end (in 7 days)
    if (!startAt) {
      const now = new Date();
      setStartAt(format(now, "yyyy-MM-dd'T'HH:mm"));
    }
    if (!endAt) {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setEndAt(format(future, "yyyy-MM-dd'T'HH:mm"));
    }

    const formatted: QuestionInput[] = aiData.questions.map((q) => ({
      type: q.type || "mcq",
      prompt: q.prompt,
      options: q.options,
      correctIndices: q.correctIndices && q.correctIndices.length > 0 ? q.correctIndices : [0],
      explanation: q.explanation || null,
      points: q.points || 10,
    }));

    if (aiData.append) {
      setQuestions((prev) => [...prev, ...formatted]);
    } else {
      setQuestions(formatted);
    }

    if (!open) {
      setOpen(true);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMode("async");
    setStatus("draft");
    setStartAt("");
    setEndAt("");
    setDurationSeconds(600);
    setCoinsPerPoint(1);
    setXpReward(100);
    setMaxAttempts(1);
    setSettings(DEFAULT_SETTINGS);
    setQuestions([{ ...DEFAULT_QUESTION }]);
  };

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = async (quiz: Quiz) => {
    setLoadingEditId(quiz.id);
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`);
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "Failed to load quiz.");
      }

      const q = body.data.quiz;
      const qs = body.data.questions as Array<{
        id: string;
        type: QuestionType;
        prompt: string;
        options: string[];
        correctIndices: number[];
        explanation: string | null;
        points: number;
      }>;

      setEditingId(quiz.id);
      setTitle(q.title ?? "");
      setDescription(q.description ?? "");
      setMode(q.mode === "live" ? "live" : "async");
      setStatus(q.status ?? "draft");
      setStartAt(toLocalInput(q.startAt));
      setEndAt(toLocalInput(q.endAt));
      setDurationSeconds(q.durationSeconds ?? 600);
      setCoinsPerPoint(q.coinsPerPoint ?? 1);
      setXpReward(q.xpReward ?? 100);
      setMaxAttempts(q.settings?.maxAttempts ?? 1);
      setSettings({ ...DEFAULT_SETTINGS, ...(q.settings ?? {}) });
      setQuestions(
        qs.map((item) => ({
          id: item.id,
          type: item.type,
          prompt: item.prompt,
          options: item.options,
          correctIndices: item.correctIndices,
          explanation: item.explanation,
          points: item.points,
        }))
      );
      setOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error loading quiz.");
    } finally {
      setLoadingEditId(null);
    }
  };

  const openAssignHost = (quiz: Quiz) => {
    setAssignHostQuizId(quiz.id);
    setAssignHostInput(quiz.hostUid ?? "");
    setAssignHostCurrentName(quiz.hostDisplayName ?? null);
    setAssignHostOpen(true);
  };

  const handleAssignHost = async () => {
    if (!assignHostQuizId) return;
    setAssignHostSaving(true);
    try {
      const res = await fetch(`/api/admin/quiz/${assignHostQuizId}/assign-host`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostUid: assignHostInput.trim() || null }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) throw new Error(body?.error ?? "Failed to assign host.");
      toast.success(assignHostInput.trim() ? "Host assigned successfully." : "Host removed.");
      setAssignHostOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign host.");
    } finally {
      setAssignHostSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        type: "mcq",
        prompt: "",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctIndices: [0],
        points: 10,
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: keyof QuestionInput, val: any) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx]!, [field]: val };
      return next;
    });
  };

  const handleOptionChange = (qIdx: number, oIdx: number, val: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx]!.options];
      opts[oIdx] = val;
      next[qIdx] = { ...next[qIdx]!, options: opts };
      return next;
    });
  };

  const handleSaveQuiz = async () => {
    if (!title.trim() || !startAt || !endAt || questions.length === 0) {
      toast.error("Please fill in all required quiz fields and at least 1 question.");
      return;
    }

    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    if (isNaN(startMs) || isNaN(endMs)) {
      toast.error("Please provide valid start and end dates.");
      return;
    }
    if (endMs <= startMs) {
      toast.error("End date must be after start date.");
      return;
    }

    // Validate and sanitize questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      if (!q.prompt.trim()) {
        toast.error(`Question #${i + 1} is missing a prompt.`);
        return;
      }
      if (!q.options || q.options.length < 2) {
        toast.error(`Question #${i + 1} must have at least 2 options.`);
        return;
      }
      const emptyOpt = q.options.some((opt) => !opt.trim());
      if (emptyOpt) {
        toast.error(`Question #${i + 1} has empty options. Please fill them in.`);
        return;
      }
      if (!q.correctIndices || q.correctIndices.length === 0) {
        toast.error(`Question #${i + 1} must have a correct option selected.`);
        return;
      }
    }

    const sanitizedQuestions = questions.map((q) => ({
      ...q,
      prompt: q.prompt.trim(),
      options: q.options.map((opt) => opt.trim()),
      explanation: q.explanation?.trim() || null,
      points: Number(q.points) || 10,
    }));

    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        mode,
        status: mode === "live" ? "draft" : status,
        startAt: startMs,
        endAt: endMs,
        durationSeconds: Number(durationSeconds),
        coinsPerPoint: Number(coinsPerPoint),
        xpReward: Number(xpReward),
        settings: { ...settings, maxAttempts: Number(maxAttempts) },
        questions: sanitizedQuestions,
      };

      const res = await fetch(
        editingId ? `/api/admin/quizzes/${editingId}` : "/api/admin/quizzes",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to save quiz.");
      }

      toast.success(editingId ? "Quiz updated successfully!" : "Quiz created successfully!");
      setOpen(false);
      setEditingId(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving quiz.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete quiz.");
      toast.success("Quiz deleted.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting quiz.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground">
            Create, edit, schedule, or delete community quizzes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="gap-2 border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 shadow-sm"
            onClick={() => setAiModalOpen(true)}
          >
            <Sparkles className="h-4 w-4 text-amber-500" /> AI Quiz Assistant
          </Button>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Quiz
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Quiz Type *</Label>
                <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMode("async")}
                    className={`rounded-xl border-2 p-3 text-left transition-colors ${
                      mode === "async"
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-border hover:border-brand-500/40"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold text-sm">
                      <Zap className="h-4 w-4 text-brand-500" /> Website Quiz
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Self-paced. Listed publicly per its status/schedule.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("live")}
                    className={`rounded-xl border-2 p-3 text-left transition-colors ${
                      mode === "live"
                        ? "border-uipath-orange bg-uipath-orange/10"
                        : "border-border hover:border-uipath-orange/40"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold text-sm">
                      <Radio className="h-4 w-4 text-uipath-orange" /> Live Session
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Instructor-led. Hidden from the public list — students join only via the Live Stage link/QR once you start it.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. UiPath Studio Basics Quiz"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of what this quiz tests..."
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {mode === "async" ? (
                  <div>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as QuizStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label>Status</Label>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Controlled by Start/End in the Live Stage console.
                    </p>
                  </div>
                )}

                <div>
                  <Label>{mode === "live" ? "Time per Question (seconds)" : "Duration (seconds)"}</Label>
                  <Input
                    type="number"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Start Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </div>

                <div>
                  <Label>End Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Coins per Point</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={coinsPerPoint}
                    onChange={(e) => setCoinsPerPoint(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>XP Reward (Max XP for 100%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10000}
                    value={xpReward}
                    onChange={(e) => setXpReward(Number(e.target.value))}
                  />
                </div>

                <div className={mode === "live" ? "hidden" : undefined}>
                  <Label>Max Attempts</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Question builder */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold">Questions ({questions.length})</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Select the radio button next to the option to mark it as the correct answer.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAiModalOpen(true)}
                      className="gap-1.5 border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 text-xs h-8 shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Auto-Fill with AI
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion} className="h-8 text-xs">
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Question
                    </Button>
                  </div>
                </div>

                {questions.map((q, qIdx) => {
                  const correctIdx = q.correctIndices[0] ?? 0;
                  return (
                    <div key={qIdx} className="space-y-3 rounded-xl border p-4 bg-muted/20 hover:border-brand-500/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">Question #{qIdx + 1}</span>
                          <Badge variant="outline" className="text-[10px] font-medium bg-background text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            ✓ Correct: Option {String.fromCharCode(65 + correctIdx)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <Label className="text-xs text-muted-foreground">Points</Label>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={q.points}
                              onChange={(e) =>
                                handleQuestionChange(qIdx, "points", Number(e.target.value))
                              }
                              className="h-8 w-16 text-xs text-center font-mono font-bold"
                            />
                          </div>
                          {questions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveQuestion(qIdx)}
                              className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div>
                        <Input
                          placeholder="Question Prompt..."
                          value={q.prompt}
                          onChange={(e) => handleQuestionChange(qIdx, "prompt", e.target.value)}
                          className="font-medium text-sm"
                        />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctIndices.includes(oIdx);
                          return (
                            <div
                              key={oIdx}
                              className={`flex items-center gap-2 rounded-lg border p-1.5 transition-colors ${
                                isCorrect
                                  ? "border-emerald-500/60 bg-emerald-500/10 shadow-xs"
                                  : "border-border/60 bg-background/60"
                              }`}
                            >
                              <label className="flex items-center justify-center p-1 cursor-pointer" title={`Mark Option ${String.fromCharCode(65 + oIdx)} as correct`}>
                                <input
                                  type="radio"
                                  name={`correct-${qIdx}`}
                                  checked={isCorrect}
                                  onChange={() => handleQuestionChange(qIdx, "correctIndices", [oIdx])}
                                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                />
                              </label>
                              <span className="text-[11px] font-bold font-mono text-muted-foreground w-4 text-center">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <Input
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                placeholder={`Option ${oIdx + 1}`}
                                className={`h-8 text-xs ${isCorrect ? "font-semibold text-emerald-700 dark:text-emerald-300" : ""}`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div>
                        <Input
                          placeholder="Optional explanation for correct answer..."
                          value={q.explanation ?? ""}
                          onChange={(e) => handleQuestionChange(qIdx, "explanation", e.target.value)}
                          className="h-7 text-[11px] text-muted-foreground bg-background/40"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button onClick={handleSaveQuiz} disabled={saving} className="w-full gap-2">
                {saving ? <Spinner className="text-white" /> : <Zap className="h-4 w-4" />}
                {editingId ? "Save Changes" : "Save Quiz"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quizzes ({quizzes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzes.map((q) => {
                    const start = toDate(q.startAt);
                    return (
                      <TableRow key={q.id}>
                        <TableCell>
                          <div className="font-semibold text-sm">{q.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {q.description}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline">{q.status}</Badge>
                            {q.mode === "live" ? (
                              <Badge className="gap-1 bg-uipath-orange/15 text-uipath-orange">
                                <Radio className="h-3 w-3" /> Live Session
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Website
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">{q.questionCount} Qs</TableCell>

                        <TableCell className="text-sm">
                          {formatDuration(q.durationSeconds)}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {start ? format(start, "PP p") : "—"}
                        </TableCell>

                        <TableCell className="text-right">
                          {q.mode === "live" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/live-quiz/${q.id}`)}
                                className="gap-1 border-uipath-orange/40 text-uipath-orange hover:bg-uipath-orange/10 mr-1"
                                title="Open Instructor Live Stage Console"
                              >
                                <Radio className="h-3.5 w-3.5 animate-pulse" /> Live Stage
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAssignHost(q)}
                                className="gap-1 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 mr-1"
                                title="Assign Quiz Host"
                              >
                                <Crown className="h-3.5 w-3.5" />
                                {q.hostDisplayName ? q.hostDisplayName.split(" ")[0] : "Host"}
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={loadingEditId === q.id}
                            onClick={() => openEdit(q)}
                          >
                            {loadingEditId === q.id ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <Pencil className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuiz(q.id)}
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

      {/* Assign Host Dialog */}
      <Dialog open={assignHostOpen} onOpenChange={setAssignHostOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-500" />
              Assign Quiz Host
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {assignHostCurrentName && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
                <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  Currently assigned to <strong>{assignHostCurrentName}</strong>
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="host-uid-input">Quiz Host User UID</Label>
              <Input
                id="host-uid-input"
                placeholder="Paste the user UID here..."
                value={assignHostInput}
                onChange={(e) => setAssignHostInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The user must already have the <strong>quiz_host</strong> role. Find their UID in the Users section.
                Leave empty to remove the current host.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setAssignHostOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignHost}
                disabled={assignHostSaving}
                className="gap-2"
              >
                {assignHostSaving ? <Spinner className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                {assignHostInput.trim() ? "Assign Host" : "Remove Host"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gemini AI Quiz Assistant Modal */}
      <AIQuizModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onApply={handleApplyAiQuiz}
        existingQuestionsCount={questions.length}
      />
    </div>
  );
}
