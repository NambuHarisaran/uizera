import { NextRequest } from "next/server";
import { assertSameOrigin, handleApi, jsonError, jsonOk, parseBody, requireAdmin } from "@/lib/server/api";
import { z } from "zod";


export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().min(3, "Prompt or quiz text must be at least 3 characters.").max(30000, "Prompt is too long (max 30,000 characters)."),
  apiKey: z.string().optional(),
  count: z.number().int().min(1).max(50).optional(),
});

interface ParsedQuestion {
  prompt: string;
  type: "mcq" | "true_false";
  options: string[];
  correctIndices: number[];
  explanation: string;
  points: number;
}

interface ParsedQuizResponse {
  title?: string;
  description?: string;
  suggestedDurationSeconds?: number;
  questions: ParsedQuestion[];
}

export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    await requireAdmin();
    const { prompt, apiKey: clientApiKey, count } = await parseBody(req, requestSchema);

    const activeApiKey = (clientApiKey?.trim() || process.env.GEMINI_API_KEY || "").trim();

    if (!activeApiKey) {
      return jsonError(
        "No Gemini API key provided. Please enter your Gemini API Key in the AI Quiz Assistant dialog or configure GEMINI_API_KEY in your environment.",
        400
      );
    }

    const systemInstruction = `You are an expert Quiz Parser and Generator for UiZera (UiPath RPA Community Platform).
Your job is to parse raw quiz text pasted by an admin OR generate brand new questions from a topic/prompt.

CRITICAL RULES:
1. Return ONLY valid, raw JSON matching the required schema. Do NOT include markdown code blocks, backticks, or any conversational text.
2. If the user pasted a raw quiz (e.g. Q1, Q2, A), B), C), D), Ans: B):
   - Parse EVERY question accurately.
   - Clean the prompt: Remove prefixes like "Q1.", "1)", "Question 1:".
   - Clean the options: Remove prefixes like "A)", "a.", "(B)", "Option C:". Keep only the pure text.
   - Accurately determine the correct option index (0 for Option A, 1 for Option B, 2 for Option C, 3 for Option D). Look for answer keys, marked answers (like bold, *, [x], "Ans: C", "Answer: 3"), or calculate the correct answer.
   - Always ensure "correctIndices" contains exactly [0], [1], [2], or [3] pointing to the right option.
3. If the user gave a topic prompt (e.g., "Create 5 questions on UiPath Selectors"):
   - Generate ${count || 5} clear, high-quality, practical multiple-choice questions.
   - Each question must have 4 distinct, plausible options.
   - Clearly identify the single correct option index in "correctIndices".
   - Provide a helpful explanation for why that answer is correct.
4. Schema:
{
  "title": "A short, engaging quiz title (e.g. 'UiPath Selectors Mastery')",
  "description": "A 1-2 sentence overview of the quiz topics covered",
  "suggestedDurationSeconds": 600,
  "questions": [
    {
      "prompt": "Which wildcard character represents zero or more characters in UiPath Selectors?",
      "type": "mcq",
      "options": ["*", "?", "%", "$"],
      "correctIndices": [0],
      "explanation": "In UiPath selectors, the asterisk (*) wildcard replaces zero or more characters, while the question mark (?) replaces exactly one character.",
      "points": 10
    }
  ]
}`;

    // Try primary models: gemini-2.5-flash (latest free tier), gemini-2.5-flash-lite, gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro
    const models = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];
    let lastError: string | null = null;
    let rawText = "";

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          activeApiKey
        )}`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: `USER INPUT / QUIZ DATA:\n${prompt}` }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          const errorMsg =
            errData?.error?.message || `Gemini API returned status ${response.status}`;
          lastError = errorMsg;
          continue; // Try next model fallback
        }

        const data = await response.json();
        rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (rawText) break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Network error contacting Gemini API.";
      }
    }


    if (!rawText) {
      return jsonError(
        `Gemini API Error: ${lastError || "Failed to generate response. Please verify your API Key."}`,
        502
      );
    }

    // Clean JSON response (strip any accidental markdown wraps)
    let cleanedJson = rawText.trim();
    if (cleanedJson.startsWith("```json")) {
      cleanedJson = cleanedJson.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```\s*/i, "").replace(/\s*```$/, "");
    }

    let parsed: ParsedQuizResponse;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      return jsonError("Failed to parse Gemini response as valid JSON.", 502);
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return jsonError("Gemini did not return any valid quiz questions from the input.", 422);
    }

    // Validate and sanitize every question
    const sanitizedQuestions: ParsedQuestion[] = parsed.questions.map((q, idx) => {
      const promptText = (q.prompt || `Question ${idx + 1}`).trim();
      const rawOptions = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["Option A", "Option B", "Option C", "Option D"];
      const cleanOptions = rawOptions.map((opt, oIdx) => String(opt || `Option ${oIdx + 1}`).trim());

      let correct = Array.isArray(q.correctIndices) && q.correctIndices.length > 0 ? q.correctIndices : [0];
      // Bound check
      correct = correct.map((c) => {
        const num = Number(c);
        return isNaN(num) || num < 0 || num >= cleanOptions.length ? 0 : num;
      });

      return {
        prompt: promptText,
        type: cleanOptions.length === 2 ? "true_false" : "mcq",
        options: cleanOptions,
        correctIndices: correct,
        explanation: (q.explanation || "").trim(),
        points: typeof q.points === "number" && q.points > 0 ? q.points : 10,
      };
    });

    return jsonOk({
      title: parsed.title || "UiPath Automation Quiz",
      description: parsed.description || "Test your knowledge on UiPath and automation concepts.",
      suggestedDurationSeconds: parsed.suggestedDurationSeconds || Math.max(300, sanitizedQuestions.length * 60),
      questions: sanitizedQuestions,
    });
  });
}
