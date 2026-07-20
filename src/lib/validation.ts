/**
 * Zod schemas — the single contract for every API boundary.
 * Shared by server routes (enforcement) and client forms (UX validation).
 * Timestamps cross the wire as epoch milliseconds.
 */

import { z } from "zod";
import { DEPARTMENTS, YEARS } from "@/lib/constants";

// ── Quiz ────────────────────────────────────────────────────────────────────

export const questionSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).optional(),
    type: z.enum(["mcq", "true_false", "multi_select", "image"]),
    prompt: z.string().min(1).max(1000),
    imageUrl: z.string().url().max(1024).nullable().optional(),
    options: z.array(z.string().min(1).max(300)).min(2).max(8),
    correctIndices: z.array(z.number().int().min(0).max(7)).min(1).max(8),
    explanation: z.string().max(2000).nullable().optional(),
    points: z.number().int().min(1).max(100),
  })
  .superRefine((q, ctx) => {
    if (q.correctIndices.some((i) => i >= q.options.length)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctIndices out of range",
      });
    }
    if (new Set(q.correctIndices).size !== q.correctIndices.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "duplicate correctIndices",
      });
    }
    if (q.type === "true_false" && q.options.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "true/false questions need exactly 2 options",
      });
    }
    if (q.type !== "multi_select" && q.correctIndices.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "single-answer questions need exactly 1 correct option",
      });
    }
    if (q.type === "image" && !q.imageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "image questions need an imageUrl",
      });
    }
  });

export const quizUpsertSchema = z
  .object({
    title: z.string().min(3).max(160),
    description: z.string().max(2000).default(""),
    coverImage: z.string().url().max(1024).nullable().optional(),
    status: z.enum(["draft", "scheduled", "live", "closed"]),
    startAt: z.number().int().positive(),
    endAt: z.number().int().positive(),
    durationSeconds: z.number().int().min(30).max(7200),
    coinsPerPoint: z.number().min(0).max(100),
    xpReward: z.number().int().min(0).max(10000).optional(),
    settings: z.object({
      randomizeQuestions: z.boolean(),
      randomizeOptions: z.boolean(),
      showReview: z.boolean(),
      maxAttempts: z.number().int().min(1).max(5),
    }),
    questions: z.array(questionSchema).min(1).max(100),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: "endAt must be after startAt",
  });

export type QuizUpsertInput = z.infer<typeof quizUpsertSchema>;

export const quizSubmitSchema = z.object({
  attemptId: z.string().min(1).max(200),
  answers: z
    .record(
      z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
      z.array(z.number().int().min(0).max(7)).max(8)
    )
    .refine((r) => Object.keys(r).length <= 100, {
      message: "too many answers",
    }),
});

export const liveQuizAnswerSchema = z.object({
  questionId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  questionIndex: z.number().int().min(0),
  selected: z.array(z.number().int().min(0).max(7)).max(8),
});

// ── Challenges ──────────────────────────────────────────────────────────────

export const challengeUpsertSchema = z.object({
  title: z.string().min(3).max(160),
  week: z.number().int().min(1).max(100),
  description: z.string().max(2000).default(""),
  instructions: z.string().max(10000).default(""),
  resources: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        url: z.string().url().max(1024),
      })
    )
    .max(20)
    .default([]),
  coins: z.number().int().min(0).max(1000),
  xp: z.number().int().min(0).max(10000).optional(),
  status: z.enum(["draft", "open", "closed"]),
  deadline: z.number().int().positive(),
});

export type ChallengeUpsertInput = z.infer<typeof challengeUpsertSchema>;

export const challengeSubmitSchema = z
  .object({
    challengeId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
    filePath: z.string().max(512).nullable().optional(),
    fileUrl: z.string().url().max(2048).nullable().optional(),
    link: z.string().url().max(1024).nullable().optional(),
    notes: z.string().max(3000).nullable().optional(),
  })
  .refine((d) => d.filePath || d.link, {
    message: "Attach a file or provide a link.",
  });

export const submissionReviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  feedback: z.string().max(2000).default(""),
  coins: z.number().int().min(0).max(1000).optional(),
});

// ── Certifications ──────────────────────────────────────────────────────────

export const certDayIdSchema = z.string().regex(/^day-(0[1-9]|[12][0-9]|30)$/);

export const certReportSchema = z.object({
  dayId: certDayIdSchema,
});

export const certVerifySchema = z.object({
  dayId: certDayIdSchema,
  uids: z.array(z.string().min(1).max(128)).min(1).max(200),
  status: z.enum(["completed", "pending"]),
});

export const certDayUpsertSchema = z.object({
  day: z.number().int().min(1).max(30),
  certName: z.string().min(2).max(200),
  description: z.string().max(2000).default(""),
  link: z.string().url().max(1024),
  coins: z.number().int().min(0).max(500),
  unlockDate: z.number().int().positive(),
});

// ── Admin: users & coins ────────────────────────────────────────────────────

export const roleUpdateSchema = z.object({
  role: z.enum(["admin", "student"]),
});

export const userStatusSchema = z.object({
  disabled: z.boolean(),
});

export const coinAwardSchema = z.object({
  uid: z.string().min(1).max(128),
  amount: z.number().int().min(-10000).max(10000),
  source: z.enum([
    "course_completion",
    "weekly_task",
    "special_activity",
    "community_contribution",
    "certification",
    "admin_adjustment",
  ]),
  reason: z.string().min(3).max(500),
});

// ── Content collections (admin CRUD) ────────────────────────────────────────

export const announcementSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(1).max(10000),
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
  pinned: z.boolean().default(false),
  published: z.boolean().default(false),
});

export const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).default(""),
  date: z.number().int().positive(),
  time: z.string().max(60).default(""),
  venue: z.string().max(200).default(""),
  image: z.string().url().max(1024).nullable().optional(),
  registrationLink: z.string().url().max(1024).nullable().optional(),
  speakers: z.array(z.string().min(1).max(120)).max(20).default([]),
  published: z.boolean().default(false),
});

export const resourceSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).default(""),
  url: z.string().url().max(1024),
  category: z.enum([
    "getting_started",
    "uipath_studio",
    "certification",
    "agentic_ai",
    "career",
    "video",
    "documentation",
    "other",
  ]),
  tags: z.array(z.string().min(1).max(40)).max(10).default([]),
  published: z.boolean().default(true),
});

export const gallerySchema = z.object({
  image: z.string().url().max(1024),
  caption: z.string().max(300).default(""),
  event: z.string().max(200).nullable().optional(),
  order: z.number().int().min(0).max(10000).default(0),
});

export const teamMemberSchema = z.object({
  name: z.string().min(2).max(120),
  role: z.string().min(2).max(120),
  section: z.enum(["faculty", "hod", "sdc", "core", "coordinators", "members"]),
  department: z.string().max(80).nullable().optional(),
  photo: z.string().url().max(1024).nullable().optional(),
  linkedin: z.string().url().max(1024).nullable().optional(),
  email: z.string().email().max(200).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  order: z.number().int().min(0).max(10000).default(0),
});

/** Allowlisted collections editable via the generic admin content API. */
export const CONTENT_SCHEMAS = {
  announcements: announcementSchema,
  events: eventSchema,
  resources: resourceSchema,
  gallery: gallerySchema,
  team: teamMemberSchema,
} as const;

export type ContentCollection = keyof typeof CONTENT_SCHEMAS;

// ── Profile & contact ───────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  department: z.enum(DEPARTMENTS).nullable().optional(),
  year: z.enum(YEARS).nullable().optional(),
  regNo: z
    .string()
    .regex(/^[A-Za-z0-9/-]{4,24}$/)
    .nullable()
    .optional(),
  bio: z.string().max(500).nullable().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  message: z.string().min(10).max(3000),
});
