import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ─────────────────────────────────────────────────────────────
// UiZera Platform — Cloudflare D1 Schema (Drizzle ORM)
// All writes flow through Next.js API routes (server-side only).
// Firebase is used exclusively for Google Auth token verification.
// ─────────────────────────────────────────────────────────────

// ── 1. Users Profile ───────────────────────────────────────────
export const users = sqliteTable("users", {
  uid: text("uid").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  photoURL: text("photo_url"),
  role: text("role").notNull().default("student"), // super_admin | admin | quiz_host | student
  department: text("department"),
  year: text("year"),
  regNo: text("reg_no"),
  bio: text("bio"),
  coins: integer("coins").notNull().default(0),
  weeklyCoins: integer("weekly_coins").notNull().default(0),
  monthlyCoins: integer("monthly_coins").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  badges: text("badges").notNull().default("[]"),
  quizzesTaken: integer("quizzes_taken").notNull().default(0),
  challengesApproved: integer("challenges_approved").notNull().default(0),
  certsCompleted: integer("certs_completed").notNull().default(0),
  disabled: integer("disabled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
  lastLoginAt: integer("last_login_at").notNull(),
});

// ── 2. Quizzes ───────────────────────────────────────────────
export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  status: text("status").notNull().default("draft"), // draft | scheduled | live | closed
  mode: text("mode").notNull().default("async"),      // async | live
  startAt: integer("start_at"),
  endAt: integer("end_at"),
  durationSeconds: integer("duration_seconds").notNull().default(600),
  questionCount: integer("question_count").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  coinsPerPoint: real("coins_per_point").notNull().default(1.0),
  xpReward: integer("xp_reward").default(100),
  settings: text("settings").notNull().default("{}"),   // JSON: QuizSettings
  createdBy: text("created_by").notNull(),
  hostUid: text("host_uid"),
  hostDisplayName: text("host_display_name"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// ── 3. Quiz Questions ─────────────────────────────────────────
export const quizQuestions = sqliteTable("quiz_questions", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("mcq"),   // mcq | true_false | multi_select | image
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url"),
  options: text("options").notNull(),             // JSON: string[]
  points: integer("points").notNull().default(10),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

// ── 4. Quiz Private Answer Keys (NEVER exposed to clients) ────
export const quizAnswerKeys = sqliteTable("quiz_answer_keys", {
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  correctIndices: text("correct_indices").notNull(), // JSON: number[]
  explanation: text("explanation"),
}, (table) => ({
  pk: primaryKey({ columns: [table.quizId, table.questionId] }),
}));

// ── 5. Live Quiz Sessions ─────────────────────────────────────
export const liveQuizSessions = sqliteTable("live_quiz_sessions", {
  quizId: text("quiz_id").primaryKey().references(() => quizzes.id, { onDelete: "cascade" }),
  quizTitle: text("quiz_title").notNull(),
  status: text("status").notNull().default("waiting"), // waiting | active | ended
  viewState: text("view_state").notNull().default("lobby"), // lobby | question | leaderboard
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  questionStartAtMs: integer("question_start_at_ms").notNull().default(0),
  questionDurationSeconds: integer("question_duration_seconds").notNull().default(30),
  revealAnswer: integer("reveal_answer", { mode: "boolean" }).notNull().default(false),
  lastAnswerAt: integer("last_answer_at"),
  updatedAt: integer("updated_at").notNull(),
});

// ── 6. Live Quiz Participants ─────────────────────────────────
export const liveQuizParticipants = sqliteTable("live_quiz_participants", {
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  uid: text("uid").notNull(),
  displayName: text("display_name").notNull(),
  photoURL: text("photo_url"),
  kicked: integer("kicked", { mode: "boolean" }).notNull().default(false),
  joinedAt: integer("joined_at").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.quizId, table.uid] }),
}));

// ── 7. Live Quiz Responses ────────────────────────────────────
export const liveQuizResponses = sqliteTable("live_quiz_responses", {
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  uid: text("uid").notNull(),
  displayName: text("display_name").notNull(),
  answers: text("answers").notNull().default("{}"), // JSON
  totalScore: integer("total_score").notNull().default(0),
  totalAnswerMs: integer("total_answer_ms").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.quizId, table.uid] }),
}));

// ── 8. Quiz Attempts (Async Web Quizzes) ─────────────────────
export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  quizTitle: text("quiz_title").notNull(),
  uid: text("uid").notNull(),
  displayName: text("display_name").notNull(),
  attemptNo: integer("attempt_no").notNull().default(1),
  status: text("status").notNull().default("in_progress"), // in_progress | submitted | expired
  questionOrder: text("question_order").notNull(), // JSON: string[]
  optionOrders: text("option_orders").notNull(),   // JSON: Record<string, number[]>
  answers: text("answers").notNull().default("{}"),// JSON
  score: integer("score").notNull().default(0),
  maxScore: integer("max_score").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  coinsEarned: integer("coins_earned").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  startedAt: integer("started_at").notNull(),
  deadlineAt: integer("deadline_at").notNull(),
  submittedAt: integer("submitted_at"),
});

// ── 9. Weekly Challenges ──────────────────────────────────────
export const challenges = sqliteTable("challenges", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  week: integer("week").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  resources: text("resources").notNull().default("[]"), // JSON
  coins: integer("coins").notNull().default(50),
  xp: integer("xp").default(50),
  status: text("status").notNull().default("draft"),    // draft | active | closed
  deadline: integer("deadline").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").notNull(),
});

// ── 10. Challenge Submissions ─────────────────────────────────
export const challengeSubmissions = sqliteTable("challenge_submissions", {
  id: text("id").primaryKey(),
  challengeId: text("challenge_id").notNull().references(() => challenges.id),
  challengeTitle: text("challenge_title").notNull(),
  uid: text("uid").notNull(),
  displayName: text("display_name").notNull(),
  fileUrl: text("file_url"),
  filePath: text("file_path"),
  link: text("link"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected | revision
  feedback: text("feedback"),
  coinsAwarded: integer("coins_awarded").notNull().default(0),
  reviewedBy: text("reviewed_by"),
  submittedAt: integer("submitted_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  history: text("history").notNull().default("[]"), // JSON
});

// ── 11. Coin Transactions ─────────────────────────────────────
export const coinTransactions = sqliteTable("coin_transactions", {
  id: text("id").primaryKey(),
  uid: text("uid").notNull(),
  displayName: text("display_name").notNull(),
  amount: integer("amount").notNull(),
  source: text("source").notNull(), // quiz | challenge | cert | admin | live_quiz
  reason: text("reason").notNull(),
  refId: text("ref_id"),
  awardedBy: text("awarded_by").notNull(),
  createdAt: integer("created_at").notNull(),
});

// ── 12. Announcements ─────────────────────────────────────────
export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  priority: text("priority").notNull().default("normal"), // low | normal | high | urgent
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  publishedAt: integer("published_at").notNull(),
  createdBy: text("created_by").notNull(),
});

// ── 13. Events ─────────────────────────────────────────────────
export const communityEvents = sqliteTable("community_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: integer("date").notNull(),
  time: text("time").notNull(),
  venue: text("venue").notNull(),
  image: text("image"),
  registrationLink: text("registration_link"),
  speakers: text("speakers").notNull().default("[]"), // JSON
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});

// ── 14. Learning Resources ─────────────────────────────────────
export const learningResources = sqliteTable("learning_resources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(),
  tags: text("tags").notNull().default("[]"), // JSON
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});

// ── 15. Team Members ──────────────────────────────────────────
export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  section: text("section").notNull(),
  department: text("department"),
  photo: text("photo"),
  linkedin: text("linkedin"),
  email: text("email"),
  bio: text("bio"),
  orderIndex: integer("order_index").notNull().default(0),
});

// ── 16. Gallery ───────────────────────────────────────────────
export const gallery = sqliteTable("gallery", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category"),
  eventDate: integer("event_date"),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: integer("created_at").notNull(),
});

// ── 17. Audit Logs ────────────────────────────────────────────
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorUid: text("actor_uid").notNull(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  details: text("details").notNull().default("{}"), // JSON
  createdAt: integer("created_at").notNull(),
});

// ── 18. Certifications 30-Day Program ─────────────────────────
export const certProgram = sqliteTable("cert_program", {
  dayId: text("day_id").primaryKey(), // e.g., "day_1"
  dayNumber: integer("day_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url"),
  resourceUrl: text("resource_url"),
  xp: integer("xp").notNull().default(10),
  coins: integer("coins").notNull().default(5),
  createdAt: integer("created_at").notNull(),
});

export const certProgress = sqliteTable("cert_progress", {
  uid: text("uid").notNull(),
  dayId: text("day_id").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  completedAt: integer("completed_at"),
  verifiedBy: text("verified_by"),
  submissionLink: text("submission_link"),
}, (table) => ({
  pk: primaryKey({ columns: [table.uid, table.dayId] }),
}));

// ── Export all table types for Drizzle inference ─────────────
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;
export type SelectQuiz = typeof quizzes.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;
export type SelectQuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertLiveQuizSession = typeof liveQuizSessions.$inferInsert;
export type SelectLiveQuizSession = typeof liveQuizSessions.$inferSelect;
export type InsertLiveQuizParticipant = typeof liveQuizParticipants.$inferInsert;
export type InsertLiveQuizResponse = typeof liveQuizResponses.$inferInsert;
export type SelectLiveQuizResponse = typeof liveQuizResponses.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;
export type SelectQuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;
export type SelectChallenge = typeof challenges.$inferSelect;
export type InsertChallengeSubmission = typeof challengeSubmissions.$inferInsert;
export type SelectChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type InsertCoinTransaction = typeof coinTransactions.$inferInsert;
