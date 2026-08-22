"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  HelpCircle,
  Key,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";

export interface AIQuestion {
  prompt: string;
  type: "mcq" | "true_false";
  options: string[];
  correctIndices: number[];
  explanation?: string;
  points: number;
}

export interface AIParsedQuiz {
  title: string;
  description: string;
  suggestedDurationSeconds: number;
  questions: AIQuestion[];
}

interface AIQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: {
    title?: string;
    description?: string;
    questions: AIQuestion[];
    append: boolean;
  }) => void;
  existingQuestionsCount: number;
}

const QUICK_TEMPLATES = [
  {
    label: "UiPath Studio & Selectors",
    prompt: "Generate 5 multiple choice questions on UiPath Studio, full selectors, partial selectors, fuzzy selectors, and regex wildcards. Mark the correct answer for each with an explanation.",
  },
  {
    label: "REFramework & Queues",
    prompt: "Generate 5 multiple choice questions on UiPath Robotic Enterprise Framework (Init, Get Transaction Data, Process Transaction, End Process) and Orchestrator Queues with correct answers and explanations.",
  },
  {
    label: "Activities & Data Scraping",
    prompt: "Generate 5 multiple choice questions on UiPath Modern Design Experience, Excel automation activities, DataTable operations, and Data Scraping with marked answers.",
  },
  {
    label: "Sample Quiz Paste",
    prompt: `1. Which activity is used to iterate through rows in a DataTable?
A) For Each
B) For Each Row in Data Table
C) While
D) Do While
Answer: B
Explanation: The 'For Each Row in Data Table' activity is specifically designed to loop through all rows in a DataTable.

2. What is the default port for UiPath Orchestrator over HTTPS?
A) 80
B) 8080
C) 443
D) 3000
Answer: C
Explanation: HTTPS connections to Orchestrator standardly use port 443.`,
  },
];

const LOCAL_STORAGE_KEY = "uizera_gemini_api_key";

export function AIQuizModal({
  open,
  onOpenChange,
  onApply,
  existingQuestionsCount,
}: AIQuizModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<AIParsedQuiz | null>(null);
  const [applyTitle, setApplyTitle] = useState(true);
  const [appendMode, setAppendMode] = useState(existingQuestionsCount > 0);

  // Load key from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedKey) {
        setApiKey(savedKey);
      } else {
        setShowKeyInput(true);
      }
    }
  }, []);

  const handleSaveKey = (val: string) => {
    setApiKey(val);
    if (typeof window !== "undefined") {
      if (val.trim()) {
        localStorage.setItem(LOCAL_STORAGE_KEY, val.trim());
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  };

  const handleGenerate = async () => {
    if (!promptInput.trim()) {
      toast.error("Please paste your quiz text or enter a prompt.");
      return;
    }

    setLoading(true);
    setParsedResult(null);

    try {
      const res = await fetch("/api/admin/quizzes/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptInput.trim(),
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "Failed to process quiz with Gemini AI.");
      }

      setParsedResult(body.data);
      toast.success(
        `Successfully extracted ${body.data.questions.length} questions with correct options ticked! 🎉`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error generating quiz.");
      // If error might be key-related, open key config
      if (!apiKey.trim()) {
        setShowKeyInput(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToQuiz = () => {
    if (!parsedResult || parsedResult.questions.length === 0) return;

    onApply({
      title: applyTitle ? parsedResult.title : undefined,
      description: applyTitle ? parsedResult.description : undefined,
      questions: parsedResult.questions,
      append: appendMode,
    });

    toast.success(
      `Populated quiz with ${parsedResult.questions.length} questions! Correct answers have been set.`
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl border-2 border-brand-500/30 shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-amber-500 text-white shadow-lg shadow-brand-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
                  Gemini AI Quiz Assistant
                  <Badge className="bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30 text-[11px]">
                    Auto-Fill Options
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Paste any raw quiz text or prompt Gemini to auto-generate questions, 4 options, and ticked correct answers.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="gap-1.5 text-xs h-8"
            >
              <Key className="h-3.5 w-3.5 text-amber-500" />
              {apiKey.trim() ? "Key Saved" : "Set API Key"}
              {showKeyInput ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* API Key Drawer */}
          <AnimatePresence>
            {showKeyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-foreground flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-amber-500" /> Google Gemini API Key
                    </Label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:underline flex items-center gap-1 text-[11px] font-medium"
                    >
                      Get Free API Key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => handleSaveKey(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Stored locally in your browser session. If configured in server environment (`GEMINI_API_KEY`), this is optional.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Template Chips */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Wand2 className="h-3 w-3 text-brand-500" /> Quick Templates & Examples
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => setPromptInput(tmpl.prompt)}
                  className="rounded-lg border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-brand-500/50 hover:bg-brand-500/10"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt / Paste Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Paste Quiz Text or Instruction Prompt *
              </Label>
              {promptInput.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPromptInput("")}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear text
                </button>
              )}
            </div>
            <Textarea
              rows={6}
              placeholder="Paste raw questions with options (e.g. Q1. ... A) ... B) ... Ans: B) OR enter a prompt like 'Generate 5 challenging questions on UiPath Orchestrator API triggers'..."
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="text-xs font-mono leading-relaxed resize-y min-h-[120px]"
            />
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-muted-foreground">
              Powered by Google Gemini 2.5 Flash
            </span>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !promptInput.trim()}
              className="gap-2 bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white shadow-md shadow-brand-500/20"
            >
              {loading ? (
                <>
                  <Spinner className="text-white h-4 w-4" />
                  <span>Processing with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Extract & Auto-Fill Options</span>
                </>
              )}
            </Button>
          </div>

          {/* Parsed Result Preview */}
          {parsedResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-4 rounded-xl border border-border bg-card/60 p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h4 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {parsedResult.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {parsedResult.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {parsedResult.questions.length} Questions
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs text-amber-500">
                    {parsedResult.questions.reduce((acc, q) => acc + q.points, 0)} Total Pts
                  </Badge>
                </div>
              </div>

              {/* Questions List Preview */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {parsedResult.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border bg-background/80 p-3 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground">
                        <span className="text-brand-500 font-bold mr-1.5">Q{idx + 1}.</span>
                        {q.prompt}
                      </p>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                        {q.points} pts
                      </Badge>
                    </div>

                    <div className="grid gap-1.5 sm:grid-cols-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctIndices.includes(oIdx);
                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 border text-xs transition-colors ${
                              isCorrect
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                                : "border-border/60 bg-muted/20 text-muted-foreground"
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                isCorrect
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isCorrect ? "✓" : String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                            {isCorrect && (
                              <span className="ml-auto text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-muted-foreground italic border-t pt-1.5 mt-1">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Options to apply */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t pt-3">
                <div className="flex flex-col sm:flex-row gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyTitle}
                      onChange={(e) => setApplyTitle(e.target.checked)}
                      className="rounded border-border text-brand-500 focus:ring-brand-500"
                    />
                    <span>Apply Quiz Title & Description</span>
                  </label>

                  {existingQuestionsCount > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appendMode}
                        onChange={(e) => setAppendMode(e.target.checked)}
                        className="rounded border-border text-brand-500 focus:ring-brand-500"
                      />
                      <span>Append to existing ({existingQuestionsCount}) questions</span>
                    </label>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleApplyToQuiz}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  <Check className="h-4 w-4" />
                  <span>Populate Quiz Form</span>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
