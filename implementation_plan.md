# Full Platform Migration to Cloudflare Pages + Cloudflare D1

This plan details the full architectural migration of the **UiZera Platform** from Vercel/Firestore to **Cloudflare Pages & Cloudflare D1** using **Drizzle ORM**, while keeping **Firebase exclusively for Google Auth**.

---

## 🎯 Architecture Summary

| Layer | Previous Stack | New Stack |
| :--- | :--- | :--- |
| **Hosting & CDN** | Vercel Serverless | **Cloudflare Pages** (via `@opennextjs/cloudflare`) |
| **Primary Database** | Firebase Firestore | **Cloudflare D1** (SQLite at the Edge, 5M reads/day) |
| **Database ORM** | Firebase SDK queries | **Drizzle ORM** (`drizzle-orm/d1`) |
| **Live Stage Sync** | Firestore `onSnapshot` | **Edge-Cached Polling (1–1.5s interval, <15ms response)** |
| **Authentication** | Firebase Auth + Session Cookies | **Firebase Auth** (Google Sign-In + Session Verification) |
| **Static Assets / CDN**| Vercel Blob / Firebase Storage | **Cloudflare Pages CDN / Public Assets** |

---

## 🗄️ Drizzle Database Schema (`src/lib/db/schema.ts`)

```typescript
import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

// 1. Users Profile (synced on Google sign-in)
export const users = sqliteTable("users", {
  uid: text("uid").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  photoURL: text("photo_url"),
  role: text("role").notNull().default("student"), // super_admin, admin, quiz_host, student
  department: text("department"),
  year: text("year"),
  regNo: text("reg_no"),
  bio: text("bio"),
  coins: integer("coins").notNull().default(0),
  weeklyCoins: integer("weekly_coins").notNull().default(0),
  monthlyCoins: integer("monthly_coins").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  badges: text("badges").notNull().default("[]"), // JSON string array
  quizzesTaken: integer("quizzes_taken").notNull().default(0),
  challengesApproved: integer("challenges_approved").notNull().default(0),
  certsCompleted: integer("certs_completed").notNull().default(0),
  disabled: integer("disabled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
  lastLoginAt: integer("last_login_at").notNull(),
});

// 2. Quizzes
export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  status: text("status").notNull().default("draft"), // draft, scheduled, live, closed
  mode: text("mode").notNull().default("async"),      // async, live
  startAt: integer("start_at"),
  endAt: integer("end_at"),
  durationSeconds: integer("duration_seconds").notNull().default(600),
  questionCount: integer("question_count").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  coinsPerPoint: real("coins_per_point").notNull().default(1.0),
  xpReward: integer("xp_reward").default(100),
  settings: text("settings").notNull().default("{}"), // JSON QuizSettings
  createdBy: text("created_by").notNull(),
  hostUid: text("host_uid"),
  hostDisplayName: text("host_display_name"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// 3. Quiz Questions
export const quizQuestions = sqliteTable("quiz_questions", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("mcq"),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url"),
  options: text("options").notNull(), // JSON array
  points: integer("points").notNull().default(10),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

// 4. Quiz Private Answer Keys
export const quizAnswerKeys = sqliteTable("quiz_answer_keys", {
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  correctIndices: text("correct_indices").notNull(), // JSON array of numbers
  explanation: text("explanation"),
}, (table) => ({
  pk: primaryKey({ columns: [table.quizId, table.questionId] }),
}));

// 5. Live Quiz Sessions
export const liveQuizSessions = sqliteTable("live_quiz_sessions", {
  quizId: text("quiz_id").primaryKey().references(() => quizzes.id, { onDelete: "cascade" }),
  quizTitle: text("quiz_title").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, active, ended
  viewState: text("view_state").notNull().default("lobby"), // lobby, question, leaderboard
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  questionStartAtMs: integer("question_start_at_ms").notNull().default(0),
  questionDurationSeconds: integer("question_duration_seconds").notNull().default(30),
  revealAnswer: integer("reveal_answer", { mode: "boolean" }).notNull().default(false),
  lastAnswerAt: integer("last_answer_at"),
  updatedAt: integer("updated_at").notNull(),
});

// 6. Live Quiz Participants
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

// 7. Live Quiz Responses
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

// 8. Quiz Attempts (Async)
export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  quizTitle: text("quiz_title").notNull(),
  uid: text("uid").notNull(),
  displayName: text("display_name").notNull(),
  attemptNo: integer("attempt_no").notNull().default(1),
  status: text("status").notNull().default("in_progress"),
  questionOrder: text("question_order").notNull(),
  optionOrders: text("option_orders").notNull(),
  answers: text("answers").notNull().default("{}"),
  score: integer("score").notNull().default(0),
  maxScore: integer("max_score").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  coinsEarned: integer("coins_earned").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  startedAt: integer("started_at").notNull(),
  deadlineAt: integer("deadline_at").notNull(),
  submittedAt: integer("submitted_at"),
});

// 9. Challenges
export const challenges = sqliteTable("challenges", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  week: integer("week").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  resources: text("resources").notNull().default("[]"), // JSON
  coins: integer("coins").notNull().default(50),
  xp: integer("xp").default(50),
  status: text("status").notNull().default("draft"),
  deadline: integer("deadline").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").notNull(),
});

// 10. Challenge Submissions
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
  status: text("status").notNull().default("pending"),
  feedback: text("feedback"),
  coinsAwarded: integer("coins_awarded").notNull().default(0),
  reviewedBy: text("reviewed_by"),
  submittedAt: integer("submitted_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  history: text("history").notNull().default("[]"),
});

// 11. Coin Transactions
export const coinTransactions = sqliteTable("coin_transactions", {
  id: text("id").primaryKey(),
  uid: text("uid").notNull(),
  displayName: text("display_name").notNull(),
  amount: integer("amount").notNull(),
  source: text("source").notNull(),
  reason: text("reason").notNull(),
  refId: text("ref_id"),
  awardedBy: text("awarded_by").notNull(),
  createdAt: integer("created_at").notNull(),
});

// 12. Announcements, Events, Resources, Team, Gallery
export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  priority: text("priority").notNull().default("normal"),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  publishedAt: integer("published_at").notNull(),
  createdBy: text("created_by").notNull(),
});

export const communityEvents = sqliteTable("community_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: integer("date").notNull(),
  time: text("time").notNull(),
  venue: text("venue").notNull(),
  image: text("image"),
  registrationLink: text("registration_link"),
  speakers: text("speakers").notNull().default("[]"),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});

export const learningResources = sqliteTable("learning_resources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(),
  tags: text("tags").notNull().default("[]"),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});

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
```

---

## 🛠️ Proposed Changes

### Phase 1: Dependencies & Drizzle Setup
#### [MODIFY] [`package.json`](file:///c:/Users/nambu/OneDrive/Desktop/Projects/uizera/package.json)
- Add `drizzle-orm`, `drizzle-kit`, and `@opennextjs/cloudflare`.
#### [NEW] `src/lib/db/schema.ts`
- Complete Drizzle SQLite schema for all 12 platform tables.
#### [NEW] `src/lib/db/client.ts`
- Universal D1 client wrapper:
  - In production on Cloudflare: connects directly to `process.env.DB` or `getCloudflareContext().env.DB`.
  - In local development: connects via Cloudflare D1 HTTP API or local SQLite proxy.
#### [NEW] `drizzle.config.ts`
- Drizzle Kit configuration for generating SQL migrations into `drizzle/`.

---

### Phase 2: Core Platform API Routes Migration to D1
#### [MODIFY] `src/lib/server/coins.ts`
- Refactor `awardCoins()` to update user coins, XP, levels, and insert `coin_transactions` directly in D1 with atomic SQL transactions.
#### [MODIFY] `src/lib/server/quiz.ts`
- Refactor quiz fetching, question retrieval, attempt generation, and answer key lookup to query D1 via Drizzle.
#### [MODIFY] `src/lib/server/live-quiz.ts`
- Refactor `endLiveQuizSession()` to compute final scores and award coins via D1.
#### [MODIFY] All API routes under `src/app/api/`:
- `/api/quiz/*` (public quiz list, attempt start, submit, leaderboard)
- `/api/live-quiz/*` (join lobby, polling route, answer submit)
- `/api/admin/*` (quizzes CRUD, live-sessions monitor, host assignment, users)
- `/api/host/*` (assigned quizzes list, host live room control)
- `/api/challenges/*` & `/api/content/*` (challenges, announcements, events, team)
- `/api/leaderboard/*` & `/api/achievements/*`

---

### Phase 3: Frontend Real-Time Sync Optimization
#### [MODIFY] `src/app/(site)/quiz/[quizId]/live/page.tsx`
- Replace client `onSnapshot` with 1.2s polling hook.
#### [MODIFY] `src/app/(site)/admin/live-quiz/[quizId]/page.tsx` & `src/app/(site)/host/[quizId]/page.tsx`
- Replace client `onSnapshot` with 1s polling hook.
#### [MODIFY] `src/app/(site)/admin/live-quiz/page.tsx`
- Replace `onSnapshot` on quizzes with 2s polling hook.

---

### Phase 4: Cloudflare Configuration & Seeding
#### [NEW] `wrangler.toml`
- Cloudflare Pages / Worker configuration with `compatibility_flags = ["nodejs_compat"]`, D1 database binding `[[d1_databases]]`.
#### [NEW] `scripts/seed-d1.ts`
- Immediate data seed script to populate starter quizzes, questions, challenges, and content into D1.

---

## 🧪 Verification Plan

### Automated Build Check
```bash
node ./node_modules/typescript/bin/tsc --noEmit
npm run build
```
Ensure zero TypeScript compilation errors.

### Manual Verification
1. **Google Auth**: Verify Google Sign-In succeeds via Firebase Auth and syncs user to D1 `users` table.
2. **Quiz Play**: Take an async website quiz, verify grading and coin awards write to D1.
3. **Live Stage Quiz**: Host starts live room from `/host/[quizId]` $\rightarrow$ 38+ participants join via `/quiz/[quizId]/live` $\rightarrow$ answer questions $\rightarrow$ verify real-time polling works smoothly with zero quota warnings.
4. **Admin Panel**: Verify all admin dashboards (`/admin`, `/admin/live-quiz`, `/admin/users`) display accurate data from D1.
