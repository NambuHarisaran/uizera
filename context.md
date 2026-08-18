# UiZera Club — Project Context

> **Last Updated:** 2026-08-18  
> **Purpose:** Comprehensive reference for AI agents and developers working on this codebase.  
> Update this file whenever significant architectural changes are made.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Name** | UiZera Club |
| **Full Name** | UiZera Club — UiPath Community, PSNA CET |
| **Tagline** | Empowering the Next Generation of Automation Leaders |
| **College** | PSNA College of Engineering & Technology |
| **Department** | Department of Computer Science and Business Systems (CSBS) |
| **Location** | Dindigul, Tamil Nadu, India |
| **Email** | uizera@psnacet.edu.in |
| **Instagram** | https://www.instagram.com/psna_uizeraclub |
| **LinkedIn** | https://www.linkedin.com/company/ui-zera-club-psnacet |
| **Firebase Project ID** | `uizera` |

**What it is:** The UiPath-first Tamil community platform for PSNA CET students. It's a full-stack gamified web app where students earn coins and XP by taking quizzes, submitting weekly automation challenges, completing 30-day certification programs, and tracking their progress on leaderboards.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, React 19) |
| **Language** | TypeScript 5 |
| **Styling** | TailwindCSS v3 + `tailwindcss-animate` |
| **UI Components** | Radix UI primitives (accordion, dialog, dropdown, tabs, etc.) |
| **Icons** | Lucide React |
| **Animations** | Framer Motion, GSAP |
| **3D** | React Three Fiber + Three.js + Drei |
| **Video** | Remotion + @remotion/player |
| **Auth** | Firebase Auth (Google OAuth only) |
| **Database** | Cloud Firestore (Free Spark Plan) |
| **Storage / Media** | Firestore string URLs (GitHub / Drive / CDN / external media) |
| **Server-side Auth** | Firebase Admin SDK (session cookies) |
| **Data Fetching** | TanStack Query v5 |
| **Form Handling** | React Hook Form + Zod |
| **Fonts** | Inter (sans), Space Grotesk (display), JetBrains Mono (mono) |
| **Notifications** | Sonner |
| **Charts** | Recharts |
| **QR** | qrcode |
| **Seeding** | tsx + scripts/seed.ts |

---

## 3. Directory Structure

```
uizera/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (site)/                  # Route group: main app with navbar+footer
│   │   │   ├── page.tsx             # Home / landing page
│   │   │   ├── layout.tsx           # Site layout (Navbar + Footer wrapper)
│   │   │   ├── about/               # About page
│   │   │   ├── achievements/        # Badges, XP, levels, quests
│   │   │   ├── admin/               # Admin panel (role-gated)
│   │   │   │   ├── page.tsx         # Admin dashboard
│   │   │   │   ├── layout.tsx       # Admin layout (role check)
│   │   │   │   ├── announcements/   # Announcement CRUD
│   │   │   │   ├── certifications/  # Cert program management
│   │   │   │   ├── challenges/      # Challenge CRUD + submission review
│   │   │   │   ├── coins/           # Manual coin adjustments
│   │   │   │   ├── content/         # Gallery, events, team, resources CMS
│   │   │   │   ├── live-quiz/       # Live quiz host control
│   │   │   │   ├── quizzes/         # Quiz CRUD
│   │   │   │   └── users/           # User management
│   │   │   ├── announcements/       # Public announcements list
│   │   │   ├── certifications/      # 30-day cert program for students
│   │   │   ├── challenges/          # Weekly challenges list + submissions
│   │   │   ├── champions/           # Champions / hall of fame
│   │   │   ├── contact/             # Contact form
│   │   │   ├── events/              # Community events
│   │   │   ├── gallery/             # Photo gallery
│   │   │   ├── leaderboard/         # Coins / XP leaderboard
│   │   │   ├── privacy/             # Privacy policy
│   │   │   ├── profile/             # User profile + coin history
│   │   │   ├── quiz/                # Quiz list + [quizId] async quiz play
│   │   │   │   └── [quizId]/        # Quiz detail, live stage, results
│   │   │   ├── resources/           # Learning resources
│   │   │   ├── team/                # Team members
│   │   │   └── terms/               # Terms of service
│   │   ├── api/                     # Next.js Route Handlers (server-only)
│   │   │   ├── achievements/        # GET achievements + POST claim quest
│   │   │   ├── admin/               # Admin-only REST routes
│   │   │   │   ├── challenges/      # CRUD + submission approve/reject
│   │   │   │   ├── certifications/  # Cert day verify/unverify
│   │   │   │   ├── coins/           # Manual coin award
│   │   │   │   ├── content/         # CMS CRUD (gallery, team, events, etc.)
│   │   │   │   ├── live-quiz/       # Live quiz session management
│   │   │   │   ├── quizzes/         # Quiz + question CRUD
│   │   │   │   └── users/           # Role management, disable/enable
│   │   │   ├── auth/session/        # POST (create session) + DELETE (destroy)
│   │   │   ├── certifications/      # GET cert program + GET/POST progress
│   │   │   ├── challenges/          # GET list + POST submit
│   │   │   ├── contact/             # POST contact form
│   │   │   ├── content/             # Public content (events, announcements, etc.)
│   │   │   ├── leaderboard/         # GET leaderboard by period
│   │   │   ├── live-quiz/           # Live quiz player endpoints
│   │   │   ├── profile/             # GET profile + coin history + PATCH update
│   │   │   └── quiz/                # GET quizzes, start/resume/submit attempt
│   │   ├── login/                   # Login page (Google sign-in)
│   │   ├── public/                  # Public-only pages (no auth required)
│   │   ├── globals.css              # Global CSS + Tailwind base
│   │   ├── layout.tsx               # Root layout (fonts, metadata, providers)
│   │   ├── error.tsx                # Global error boundary
│   │   └── not-found.tsx            # 404 page
│   ├── components/
│   │   ├── illustrations/           # SVG/3D illustration components
│   │   ├── landing/                 # Landing page sections (hero, features, etc.)
│   │   ├── layout/
│   │   │   ├── navbar.tsx           # Main navigation (responsive, auth-aware)
│   │   │   ├── footer.tsx           # Site footer
│   │   │   └── theme-toggle.tsx     # Dark/light mode toggle
│   │   ├── providers/
│   │   │   ├── auth-provider.tsx    # Firebase auth + Firestore user context
│   │   │   ├── query-provider.tsx   # TanStack Query client
│   │   │   └── theme-provider.tsx   # next-themes wrapper
│   │   ├── remotion/                # Remotion video components
│   │   ├── shared/                  # Reusable micro-components
│   │   │   ├── coin-chip.tsx        # Coin display badge
│   │   │   ├── empty-state.tsx      # Empty state placeholder
│   │   │   ├── magnetic.tsx         # Magnetic hover effect
│   │   │   ├── marquee.tsx          # Scrolling marquee
│   │   │   ├── motion.tsx           # Framer Motion wrappers
│   │   │   ├── parallax.tsx         # Parallax scroll effect
│   │   │   ├── qr-code.tsx          # QR code generator
│   │   │   ├── rotating-text.tsx    # Animated rotating text
│   │   │   ├── scroll-stack.tsx     # Scroll-driven card stack
│   │   │   ├── section-heading.tsx  # Consistent section header
│   │   │   ├── spinner.tsx          # Loading spinner
│   │   │   └── tilt-card.tsx        # 3D tilt hover card
│   │   └── ui/                      # Radix-based shadcn-style primitives
│   ├── lib/
│   │   ├── auth/
│   │   │   └── session.ts           # Session cookie read + role check (server)
│   │   ├── firebase/
│   │   │   ├── client.ts            # Firebase client SDK (browser only)
│   │   │   └── admin.ts             # Firebase Admin SDK (server only)
│   │   ├── server/
│   │   │   ├── api.ts               # handleApi, requireUser/Admin, parseBody, CSRF
│   │   │   ├── audit.ts             # Append-only audit log writer
│   │   │   ├── coins.ts             # awardCoins / bumpStats (ONLY coin mutation path)
│   │   │   ├── quiz.ts              # Quiz helpers (build docs, get questions, etc.)
│   │   │   └── rate-limit.ts        # Simple in-memory rate limiter
│   │   ├── constants.ts             # SITE, NAV_LINKS, APP_LINKS, BADGES, DEPARTMENTS
│   │   ├── fetcher.ts               # Client-side fetch helpers (fetcher, postJson)
│   │   ├── hooks.ts                 # All TanStack Query hooks (useQuizzes, useAuth, etc.)
│   │   ├── quiz-option-styles.ts    # Quiz option styling helpers
│   │   ├── utils.ts                 # cn, toMillis, levelForXp, shuffle, formatCoins, etc.
│   │   └── validation.ts            # Zod schemas for all API inputs
│   ├── types/
│   │   └── index.ts                 # All shared TypeScript interfaces and types
│   └── middleware.ts                # Edge middleware: cookie-presence route gate
├── functions/                       # Firebase Cloud Functions (optional)
├── scripts/
│   └── seed.ts                      # Firestore seed script (run: npm run seed)
├── firestore.rules                  # Firestore security rules
├── storage.rules                    # Firebase Storage security rules
├── firestore.indexes.json           # Composite index definitions
├── firebase.json                    # Firebase project config
├── .firebaserc                      # Firebase project alias (uizera)
├── next.config.ts                   # Next.js config (security headers, image domains)
├── tailwind.config.ts               # Tailwind config (custom tokens, animations)
├── tsconfig.json                    # TypeScript config (path alias: @/ -> src/)
├── package.json                     # Dependencies + scripts
└── .env.example                     # Environment variable template
```

---

## 4. Data Model (Firestore Collections)

| Collection | Description | Access |
|---|---|---|
| `users/{uid}` | Full user profile (coins, XP, level, badges, stats, role) | Owner + Admin read; server write only |
| `leaderboard/{uid}` | Public-safe mirror (no email/regNo) | Public read; server write only |
| `quizzes/{quizId}` | Quiz metadata | Admin or signed-in (non-draft) |
| `quizzes/{quizId}/questions/{qId}` | Public question docs (no answer) | Admin read only via Firestore; served by server |
| `quizzes/{quizId}/answerKey/main` | Private answer key | **Never** readable by any client; server-only |
| `quizAttempts/{attemptId}` | Quiz attempt (id: `{quizId}_{uid}_{attemptNo}`) | Owner + Admin |
| `liveQuizSessions/{quizId}` | Live quiz real-time session state | Signed-in read; server write |
| `challenges/{challengeId}` | Weekly challenge definitions | Admin or signed-in (non-draft) |
| `submissions/{submissionId}` | Challenge submissions (id: `{challengeId}_{uid}`) | Owner + Admin |
| `certProgram/{dayId}` | 30-day cert program day definitions (day-01..day-30) | Signed-in read |
| `certProgress/{uid}` | Per-user cert completion status | Owner + Admin |
| `coinTransactions/{txId}` | Append-only coin ledger | Owner + Admin |
| `announcements/{id}` | Club announcements | Published: public; Admin: all |
| `events/{id}` | Community events | Published: public |
| `resources/{id}` | Learning resources | Published: public |
| `gallery/{id}` | Photo gallery items | Public |
| `team/{id}` | Team member profiles | Public |
| `auditLogs/{logId}` | Admin action audit trail | Admin read only |
| `contactMessages/{msgId}` | Contact form submissions | Admin read; server write |
| `config/{docId}` | App-level config | Admin read |

---

## 5. Authentication & Authorization

### Auth Flow
1. User clicks "Sign in with Google" -> `signInWithPopup` (Firebase Auth)
2. Client gets `idToken` -> POSTs to `/api/auth/session`
3. Server verifies token with Admin SDK -> creates `__session` HttpOnly cookie (5-day expiry)
4. On first sign-in, server creates the `users/{uid}` Firestore document and sets custom claims (`role`)
5. `AuthProvider` listens to `onAuthStateChanged` + Firestore real-time snapshot of `users/{uid}`

### Roles
| Role | Description |
|---|---|
| `student` | Default; can take quizzes, submit challenges, track progress |
| `admin` | All student permissions + full admin panel access |
| `super_admin` | Admin + can manage other admins; bootstrapped via `SUPER_ADMIN_EMAILS` env var |

### Security Model
- **Client SDK**: Read-only, scoped by Firestore Security Rules
- **All writes**: Flow exclusively through Next.js API routes using Admin SDK (bypasses rules)
- **Middleware** (`src/middleware.ts`): Cookie-presence gate (UX only; every route re-verifies independently)
- **CSRF protection**: `assertSameOrigin()` in state-changing API routes
- **Answer keys**: Structurally impossible to read via client — `answerKey` subcollection is `allow read, write: if false`

---

## 6. Core Domain Logic

### Gamification System
- **Coins**: Lifetime earning currency; awarded by `awardCoins()` (ONLY function that mutates coin balance)
  - Also tracked: `weeklyCoins` and `monthlyCoins` for leaderboard periods
  - Single Firestore transaction: balance + weekly + monthly + XP + level + badges + ledger entry
- **XP**: Lifetime-earned, never decreases; drives the level system
- **Level formula**: `level = floor(sqrt(xp / 100)) + 1` (max level 50)
- **Rank titles**: Rookie (1-9) -> Coder (10-19) -> Expert (20-29) -> Master (30-39) -> Champion (40+)
- **Badges**: Earned automatically by threshold — checked on every `awardCoins` call
- **Quests**: Daily/lifetime goals with XP + coin rewards; claimed via `/api/achievements/claim`

### Badge Thresholds
| Badge | Trigger |
|---|---|
| `first_quiz` | quizzesTaken >= 1 |
| `quiz_5` | quizzesTaken >= 5 |
| `quiz_10` | quizzesTaken >= 10 |
| `perfect_score` | 100% on a quiz (granted directly by quiz submit handler) |
| `first_challenge` | challengesApproved >= 1 |
| `challenge_5` | challengesApproved >= 5 |
| `cert_7` | certsCompleted >= 7 |
| `cert_15` | certsCompleted >= 15 |
| `cert_30` | certsCompleted >= 30 |
| `coins_100` | xp >= 100 |
| `coins_500` | xp >= 500 |
| `coins_1000` | xp >= 1000 |

### Quiz System
- **Modes**: `async` (self-paced within time window) | `live` (host-controlled stage)
- **Question types**: `mcq`, `true_false`, `multi_select`, `image`
- **Randomization**: Per-attempt question order + option order stored in the attempt doc (deterministic resume)
- **Attempt ID pattern**: `{quizId}_{uid}_{attemptNo}`
- **Grading**: Server-only; answers compared against `answerKey/main` subcollection
- **Live Quiz**: Real-time via `liveQuizSessions/{quizId}` Firestore doc; admin host controls `currentQuestionIndex` and `revealAnswer`

### 30-Day Certification Program
- 30 daily cert tasks defined in `certProgram` collection
- Students report completion -> status = `"reported"`
- Admin verifies -> status = `"completed"` + coins/XP awarded via `awardCoins()`

### Weekly Challenges
- Admin creates challenges with deadline, coin reward, XP
- Students upload a file (Firebase Storage) or link
- Submission ID: `{challengeId}_{uid}` (one submission per student per challenge, enforced server-side)
- Admin reviews: `approved` -> `awardCoins()`, `rejected` -> feedback only

---

## 7. API Routes Reference

### Public / Authenticated
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/session` | Create session cookie from Firebase ID token |
| `DELETE` | `/api/auth/session` | Destroy session cookie (sign out) |
| `GET` | `/api/leaderboard?period=overall/weekly/monthly` | Leaderboard entries |
| `GET` | `/api/quiz` | List non-draft quizzes |
| `GET` | `/api/quiz/[quizId]` | Quiz metadata + current attempt |
| `POST` | `/api/quiz/[quizId]/start` | Start or resume a quiz attempt |
| `POST` | `/api/quiz/[quizId]/submit` | Submit answers + grade + award coins |
| `GET` | `/api/quiz/[quizId]/review` | Post-attempt review (if showReview=true) |
| `GET` | `/api/quiz/[quizId]/leaderboard` | Per-quiz top scores |
| `GET` | `/api/challenges` | List open challenges + my submissions |
| `POST` | `/api/challenges` | Submit a challenge response |
| `GET` | `/api/certifications` | List cert program days |
| `GET` | `/api/certifications/progress` | My cert progress |
| `POST` | `/api/certifications/progress` | Report a day as completed |
| `GET` | `/api/profile` | My full user profile |
| `PATCH` | `/api/profile` | Update bio/department/year/regNo |
| `GET` | `/api/profile/coins` | My coin transaction history |
| `GET` | `/api/achievements` | XP, level, badges, quests |
| `POST` | `/api/achievements/claim` | Claim a completed quest reward |
| `GET` | `/api/content/events` | Published events |
| `GET` | `/api/content/announcements` | Published announcements |
| `GET` | `/api/content/resources` | Published resources |
| `GET` | `/api/content/team` | Team members |
| `GET` | `/api/content/gallery` | Gallery items |
| `POST` | `/api/contact` | Submit contact form (rate-limited) |

### Admin-Only (require `admin` or `super_admin` role)
| Method | Path | Description |
|---|---|---|
| `GET/POST` | `/api/admin/quizzes` | List / create quizzes |
| `GET/PATCH/DELETE` | `/api/admin/quizzes/[quizId]` | Quiz CRUD |
| `GET/POST` | `/api/admin/challenges` | List / create challenges |
| `POST` | `/api/admin/challenges/[id]/review` | Approve / reject submission |
| `POST` | `/api/admin/certifications/verify` | Verify cert day completion |
| `GET` | `/api/admin/users` | List all users |
| `PATCH` | `/api/admin/users/[uid]/role` | Set user role |
| `POST` | `/api/admin/coins` | Manual coin adjustment |
| `POST/DELETE` | `/api/admin/live-quiz/[quizId]/session` | Start/end live session |
| `PATCH` | `/api/admin/live-quiz/[quizId]/session` | Advance question, reveal answer |
| Various | `/api/admin/content/...` | CMS CRUD (events, announcements, gallery, team, resources) |

---

## 8. Environment Variables

```env
# Firebase client SDK (public - safe)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=uizera.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=uizera
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=uizera.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin SDK (SERVER ONLY - never expose)
FIREBASE_ADMIN_PROJECT_ID=uizera
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@uizera.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Bootstrap super admins
SUPER_ADMIN_EMAILS=uizera@psnacet.edu.in

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 9. Key Utility Functions (`src/lib/utils.ts`)

| Function | Description |
|---|---|
| `cn(...inputs)` | Tailwind class merging (clsx + tailwind-merge) |
| `toMillis(ts)` | Normalize any FireTimestamp shape -> epoch ms |
| `toDate(ts)` | FireTimestamp -> Date or null |
| `formatCoins(n)` | Format number with Indian locale (en-IN) |
| `levelForXp(xp)` | XP -> level (1-50) |
| `xpForLevel(level)` | Level -> XP threshold |
| `levelProgress(xp)` | Progress (0-1) within current level |
| `rankTitleForLevel(level)` | Level -> Rank title string |
| `rankStyleForLevel(level)` | Level -> { title, badgeClass } |
| `formatDuration(s)` | Seconds -> "M:SS" string |
| `initials(name)` | Full name -> initials |
| `shortName(name)` | First name only, truncated |
| `truncate(text, max)` | Truncate with ellipsis |
| `shuffle(arr)` | Fisher-Yates shuffle (returns new array) |

---

## 10. Server-Side Patterns

### API Route Pattern
Every Route Handler uses this pattern:
```ts
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();  // or requireAdmin()
    const body = await parseBody(req, myZodSchema);
    // ... business logic
    return jsonOk({ result });
  });
}
```

### Coin Award Pattern
```ts
await awardCoins({
  uid: user.uid,
  amount: coinsEarned,
  xpAmount: xpEarned,
  source: "quiz",
  reason: `Quiz: ${quiz.title}`,
  refId: attemptId,
  awardedBy: "system",
  counters: { quizzesTaken: 1 },
  extraBadges: isPerfect ? ["perfect_score"] : [],
});
```

---

## 11. Navigation Structure

### Public Site (Navbar)
Home | About | Events | Announcements | Achievements | Champions | Leaderboard | Resources | Team | Contact

### Protected App Links (logged-in users)
Quizzes | Challenges | 30-Day Certs | Achievements | Champions | Leaderboard | Announcements | Profile

### Protected Routes (middleware gates)
`/admin/*`, `/profile/*`, `/quiz/*`, `/challenges/*`, `/certifications/*`

---

## 12. Development Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type check (no emit)
npm run emulators    # Firebase emulators
npm run deploy:rules # Deploy Firestore + Storage rules
npm run deploy:functions # Deploy Cloud Functions
npm run seed         # Seed Firestore with sample data
```

---

## 13. Key Conventions & Rules

1. **Never mutate coins from client.** The only coin write path is `src/lib/server/coins.ts -> awardCoins()`.
2. **Answer keys are server-only.** The `answerKey` subcollection has `allow read, write: if false` in rules.
3. **All writes go through API routes.** Firestore Security Rules allow no client writes.
4. **Role claims are server-set.** Custom claims (`token.role`) set via Admin SDK on sign-in.
5. **Session cookies are HttpOnly.** Middleware can only check presence, not verify. Each route re-verifies.
6. **Path alias `@/`** maps to `src/` (configured in `tsconfig.json`).
7. **`server-only` import** is used in all server-only modules to prevent client-side import.
8. **TanStack Query** is the single client data-fetching layer - no raw `useEffect` fetches in components.
9. **Zod schemas** live in `src/lib/validation.ts` - always validate API inputs with `parseBody()`.
10. **Firestore timestamps**: Use `toMillis()` from `utils.ts` to normalize any `FireTimestamp` before display.

---

## 14. Firestore Indexes

Key composite indexes defined in `firestore.indexes.json`:
- `quizAttempts`: `quizId ASC, score DESC` (leaderboard queries)
- `quizAttempts`: `uid ASC, submittedAt DESC` (user history)
- `coinTransactions`: `uid ASC, createdAt DESC`
- `challenges`: `status ASC, deadline ASC`
- `submissions`: `challengeId ASC, status ASC`
- `announcements`: `published ASC, publishedAt DESC`
- `leaderboard`: Various period-based sorts (coins, weeklyCoins, monthlyCoins)

---

*This file should be updated whenever: new pages are added, new API routes are created, the data model changes, or any architectural decision is made.*
