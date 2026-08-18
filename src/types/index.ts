/**
 * Domain types shared across client and server.
 *
 * Timestamps: Firestore returns different timestamp shapes on the client SDK,
 * the Admin SDK, and after JSON serialization. `FireTimestamp` covers all of
 * them; use `toMillis()` from `@/lib/utils` to normalize for display.
 */

export type FireTimestamp =
  | { seconds: number; nanoseconds: number }
  | { _seconds: number; _nanoseconds: number }
  | number
  | string
  | Date
  | null;

export type Role = "super_admin" | "admin" | "student";

// ── Users ───────────────────────────────────────────────────────────────────

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: Role;
  department: string | null;
  year: string | null;
  regNo: string | null;
  bio: string | null;
  coins: number;
  weeklyCoins: number;
  monthlyCoins: number;
  xp: number;
  level: number;
  badges: string[];
  quizzesTaken: number;
  challengesApproved: number;
  certsCompleted: number;
  disabled: boolean;
  createdAt: FireTimestamp;
  lastLoginAt: FireTimestamp;
}

/** Public-safe leaderboard mirror — never contains email/regNo/role. */
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  department: string | null;
  year: string | null;
  coins: number;
  weeklyCoins: number;
  monthlyCoins: number;
  xp: number;
  level: number;
  badges: string[];
  updatedAt: FireTimestamp;
}

export type LeaderboardPeriod = "weekly" | "monthly" | "overall";

// ── Quizzes ─────────────────────────────────────────────────────────────────

export type QuizStatus = "draft" | "scheduled" | "live" | "closed";
export type QuestionType = "mcq" | "true_false" | "multi_select" | "image";

export interface QuizSettings {
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showReview: boolean;
  maxAttempts: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  status: QuizStatus;
  mode?: "async" | "live";
  startAt: FireTimestamp;
  endAt: FireTimestamp;
  durationSeconds: number;
  questionCount: number;
  totalPoints: number;
  coinsPerPoint: number;
  xpReward?: number;
  settings: QuizSettings;
  createdBy: string;
  createdAt: FireTimestamp;
  updatedAt: FireTimestamp;
}

export interface LiveParticipant {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  joinedAt: FireTimestamp;
  kicked?: boolean;
}

export interface LiveQuizSession {
  quizId: string;
  quizTitle: string;
  status: "waiting" | "active" | "ended";
  viewState?: "question" | "leaderboard" | "lobby";
  currentQuestionIndex: number;
  questionStartAtMs: number;
  questionDurationSeconds: number;
  revealAnswer: boolean;
  participantCount?: number;
  lastAnswerAt?: FireTimestamp;
  updatedAt: FireTimestamp;
}

/** Question as served to a student during play — NO answer fields. */
export interface QuizQuestionPublic {
  id: string;
  type: QuestionType;
  prompt: string;
  imageUrl: string | null;
  options: string[];
  points: number;
  order: number;
}

/** Full question shape used by admins (answer lives in the private key doc). */
export interface QuizQuestionAdmin extends QuizQuestionPublic {
  /** Indices into options[]. Single-element for mcq/true_false/image. */
  correctIndices: number[];
  explanation: string | null;
}

export type AttemptStatus = "in_progress" | "submitted" | "expired";

export interface QuizAttempt {
  id: string; // `${quizId}_${uid}_${attemptNo}`
  quizId: string;
  quizTitle: string;
  uid: string;
  displayName: string;
  attemptNo: number;
  status: AttemptStatus;
  /** Question IDs in the order this attempt sees them (randomized per attempt). */
  questionOrder: string[];
  /** Per-question option shuffles: questionId → shuffled index → original index. */
  optionOrders: Record<string, number[]>;
  /** questionId → selected original option indices. */
  answers: Record<string, number[]>;
  score: number;
  maxScore: number;
  correctCount: number;
  coinsEarned: number;
  xpEarned?: number;
  startedAt: FireTimestamp;
  deadlineAt: FireTimestamp;
  submittedAt: FireTimestamp;
}

export interface QuizReviewItem {
  question: QuizQuestionPublic;
  selected: number[];
  correct: number[];
  explanation: string | null;
  earned: number;
}

// ── Weekly challenges ───────────────────────────────────────────────────────

export type ChallengeStatus = "draft" | "open" | "closed";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface ChallengeResource {
  label: string;
  url: string;
}

export interface Challenge {
  id: string;
  title: string;
  week: number;
  description: string;
  instructions: string;
  resources: ChallengeResource[];
  coins: number;
  xp?: number;
  status: ChallengeStatus;
  deadline: FireTimestamp;
  createdBy: string;
  createdAt: FireTimestamp;
}

export interface SubmissionHistoryItem {
  at: FireTimestamp;
  action: string;
  by: string;
  note: string | null;
}

export interface ChallengeSubmission {
  id: string; // `${challengeId}_${uid}`
  challengeId: string;
  challengeTitle: string;
  uid: string;
  displayName: string;
  fileUrl: string | null;
  filePath: string | null;
  link: string | null;
  notes: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  coinsAwarded: number;
  reviewedBy: string | null;
  submittedAt: FireTimestamp;
  updatedAt: FireTimestamp;
  history: SubmissionHistoryItem[];
}

// ── 30-day certification program ────────────────────────────────────────────

export interface CertDay {
  id: string; // "day-01" .. "day-30"
  day: number;
  certName: string;
  description: string;
  link: string;
  coins: number;
  xp?: number;
  unlockDate: FireTimestamp;
}

export type CertDayStatus = "pending" | "reported" | "completed";

export interface CertProgress {
  uid: string;
  /** "day-01" → status entry */
  days: Record<
    string,
    {
      status: CertDayStatus;
      reportedAt: FireTimestamp;
      verifiedBy: string | null;
      verifiedAt: FireTimestamp;
    }
  >;
  completedCount: number;
  updatedAt: FireTimestamp;
}

// ── Coins & audit ───────────────────────────────────────────────────────────

export type CoinSource =
  | "quiz"
  | "challenge"
  | "course_completion"
  | "weekly_task"
  | "special_activity"
  | "community_contribution"
  | "certification"
  | "quest_reward"
  | "admin_adjustment";

export interface CoinTransaction {
  id: string;
  uid: string;
  displayName: string;
  amount: number;
  source: CoinSource;
  reason: string;
  refId: string | null;
  awardedBy: string;
  createdAt: FireTimestamp;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  target: string;
  details: Record<string, unknown>;
  createdAt: FireTimestamp;
}

// ── Content ─────────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "important" | "urgent";
  pinned: boolean;
  published: boolean;
  publishedAt: FireTimestamp;
  createdBy: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: FireTimestamp;
  time: string;
  venue: string;
  image: string | null;
  registrationLink: string | null;
  speakers: string[];
  published: boolean;
  createdAt: FireTimestamp;
}

export type ResourceCategory =
  | "getting_started"
  | "uipath_studio"
  | "certification"
  | "agentic_ai"
  | "career"
  | "video"
  | "documentation"
  | "other";

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: ResourceCategory;
  tags: string[];
  published: boolean;
  createdAt: FireTimestamp;
}

export interface GalleryItem {
  id: string;
  image: string;
  caption: string;
  event: string | null;
  order: number;
}

export type TeamSection =
  | "faculty"
  | "hod"
  | "sdc"
  | "core"
  | "coordinators"
  | "members";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  section: TeamSection;
  department: string | null;
  photo: string | null;
  linkedin: string | null;
  email: string | null;
  bio: string | null;
  order: number;
}

// ── Badges, quests & levels ──────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  tier: "bronze" | "silver" | "gold" | "legend";
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  rewardCoins: number;
  category: "daily" | "lifetime";
  icon: string;
  current: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

// ── API envelopes ───────────────────────────────────────────────────────────

export interface ApiOk<T> {
  ok: true;
  data: T;
}

export interface ApiErr {
  ok: false;
  error: string;
}

export type ApiResult<T> = ApiOk<T> | ApiErr;
