"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Coins,
  Pencil,
  Plus,
  Trash2,
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

export default function AdminQuizzesPage() {
  const { data, isLoading, refetch } = useAdminQuizzes();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
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
    if (!title || !startAt || !endAt || questions.length === 0) {
      toast.error("Please fill in all required quiz fields and at least 1 question.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title,
        description,
        status,
        startAt: new Date(startAt).getTime(),
        endAt: new Date(endAt).getTime(),
        durationSeconds: Number(durationSeconds),
        coinsPerPoint: Number(coinsPerPoint),
        xpReward: Number(xpReward),
        settings: { ...settings, maxAttempts: Number(maxAttempts) },
        questions,
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

        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Create Quiz
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
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

                <div>
                  <Label>Duration (seconds)</Label>
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

                <div>
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
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold">Questions ({questions.length})</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Question
                  </Button>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-3 rounded-lg border p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Question #{qIdx + 1}</span>
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
                            className="h-8 w-16 text-xs"
                          />
                        </div>
                        {questions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-destructive hover:bg-destructive/10"
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
                      />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctIndices.includes(oIdx)}
                            onChange={() => handleQuestionChange(qIdx, "correctIndices", [oIdx])}
                          />
                          <Input
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="h-8 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                          <Badge variant="outline">{q.status}</Badge>
                        </TableCell>

                        <TableCell className="text-sm">{q.questionCount} Qs</TableCell>

                        <TableCell className="text-sm">
                          {formatDuration(q.durationSeconds)}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {start ? format(start, "PP p") : "—"}
                        </TableCell>

                        <TableCell className="text-right">
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
    </div>
  );
}
