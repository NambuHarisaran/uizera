/**
 * scripts/migrate-d1.ts
 *
 * Pushes all UiZera SQL table definitions directly to Cloudflare D1
 * using the Cloudflare D1 HTTP API. Run with:
 *   node --env-file=.env.local -r tsx/esm scripts/migrate-d1.ts
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID!;
const API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN!;

const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

async function execSQL(sql: string, label: string): Promise<void> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });

  const json = await res.json() as any;
  if (!json.success) {
    console.error(`❌ FAILED: ${label}`);
    console.error(JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }
  console.log(`✅ ${label}`);
}

async function main() {
  console.log("\n🚀 UiZera D1 Migration Starting...\n");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      photo_url TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      department TEXT,
      year TEXT,
      reg_no TEXT,
      bio TEXT,
      coins INTEGER NOT NULL DEFAULT 0,
      weekly_coins INTEGER NOT NULL DEFAULT 0,
      monthly_coins INTEGER NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      badges TEXT NOT NULL DEFAULT '[]',
      quizzes_taken INTEGER NOT NULL DEFAULT 0,
      challenges_approved INTEGER NOT NULL DEFAULT 0,
      certs_completed INTEGER NOT NULL DEFAULT 0,
      disabled INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      last_login_at INTEGER NOT NULL
    )
  `, "Create table: users");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      mode TEXT NOT NULL DEFAULT 'async',
      start_at INTEGER,
      end_at INTEGER,
      duration_seconds INTEGER NOT NULL DEFAULT 600,
      question_count INTEGER NOT NULL DEFAULT 0,
      total_points INTEGER NOT NULL DEFAULT 0,
      coins_per_point REAL NOT NULL DEFAULT 1.0,
      xp_reward INTEGER DEFAULT 100,
      settings TEXT NOT NULL DEFAULT '{}',
      created_by TEXT NOT NULL,
      host_uid TEXT,
      host_display_name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `, "Create table: quizzes");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'mcq',
      prompt TEXT NOT NULL,
      image_url TEXT,
      options TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 10,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `, "Create table: quiz_questions");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS quiz_answer_keys (
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      correct_indices TEXT NOT NULL,
      explanation TEXT,
      PRIMARY KEY (quiz_id, question_id)
    )
  `, "Create table: quiz_answer_keys");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS live_quiz_sessions (
      quiz_id TEXT PRIMARY KEY REFERENCES quizzes(id) ON DELETE CASCADE,
      quiz_title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      view_state TEXT NOT NULL DEFAULT 'lobby',
      current_question_index INTEGER NOT NULL DEFAULT 0,
      question_start_at_ms INTEGER NOT NULL DEFAULT 0,
      question_duration_seconds INTEGER NOT NULL DEFAULT 30,
      reveal_answer INTEGER NOT NULL DEFAULT 0,
      last_answer_at INTEGER,
      updated_at INTEGER NOT NULL
    )
  `, "Create table: live_quiz_sessions");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS live_quiz_participants (
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      uid TEXT NOT NULL,
      display_name TEXT NOT NULL,
      photo_url TEXT,
      kicked INTEGER NOT NULL DEFAULT 0,
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (quiz_id, uid)
    )
  `, "Create table: live_quiz_participants");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS live_quiz_responses (
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      uid TEXT NOT NULL,
      display_name TEXT NOT NULL,
      answers TEXT NOT NULL DEFAULT '{}',
      total_score INTEGER NOT NULL DEFAULT 0,
      total_answer_ms INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (quiz_id, uid)
    )
  `, "Create table: live_quiz_responses");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      quiz_title TEXT NOT NULL,
      uid TEXT NOT NULL,
      display_name TEXT NOT NULL,
      attempt_no INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'in_progress',
      question_order TEXT NOT NULL,
      option_orders TEXT NOT NULL,
      answers TEXT NOT NULL DEFAULT '{}',
      score INTEGER NOT NULL DEFAULT 0,
      max_score INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      coins_earned INTEGER NOT NULL DEFAULT 0,
      xp_earned INTEGER NOT NULL DEFAULT 0,
      started_at INTEGER NOT NULL,
      deadline_at INTEGER NOT NULL,
      submitted_at INTEGER
    )
  `, "Create table: quiz_attempts");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      week INTEGER NOT NULL,
      description TEXT NOT NULL,
      instructions TEXT NOT NULL,
      resources TEXT NOT NULL DEFAULT '[]',
      coins INTEGER NOT NULL DEFAULT 50,
      xp INTEGER DEFAULT 50,
      status TEXT NOT NULL DEFAULT 'draft',
      deadline INTEGER NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `, "Create table: challenges");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS challenge_submissions (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL REFERENCES challenges(id),
      challenge_title TEXT NOT NULL,
      uid TEXT NOT NULL,
      display_name TEXT NOT NULL,
      file_url TEXT,
      file_path TEXT,
      link TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      feedback TEXT,
      coins_awarded INTEGER NOT NULL DEFAULT 0,
      reviewed_by TEXT,
      submitted_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      history TEXT NOT NULL DEFAULT '[]'
    )
  `, "Create table: challenge_submissions");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS coin_transactions (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL,
      display_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      source TEXT NOT NULL,
      reason TEXT NOT NULL,
      ref_id TEXT,
      awarded_by TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `, "Create table: coin_transactions");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      pinned INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      published_at INTEGER NOT NULL,
      created_by TEXT NOT NULL
    )
  `, "Create table: announcements");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS community_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date INTEGER NOT NULL,
      time TEXT NOT NULL,
      venue TEXT NOT NULL,
      image TEXT,
      registration_link TEXT,
      speakers TEXT NOT NULL DEFAULT '[]',
      published INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `, "Create table: community_events");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS learning_resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      published INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `, "Create table: learning_resources");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      section TEXT NOT NULL,
      department TEXT,
      photo TEXT,
      linkedin TEXT,
      email TEXT,
      bio TEXT,
      order_index INTEGER NOT NULL DEFAULT 0
    )
  `, "Create table: team_members");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,
      category TEXT,
      event_date INTEGER,
      uploaded_by TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `, "Create table: gallery");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_uid TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      details TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL
    )
  `, "Create table: audit_logs");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS cert_program (
      day_id TEXT PRIMARY KEY,
      day_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      video_url TEXT,
      resource_url TEXT,
      xp INTEGER NOT NULL DEFAULT 10,
      coins INTEGER NOT NULL DEFAULT 5,
      created_at INTEGER NOT NULL
    )
  `, "Create table: cert_program");

  await execSQL(`
    CREATE TABLE IF NOT EXISTS cert_progress (
      uid TEXT NOT NULL,
      day_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      verified_by TEXT,
      submission_link TEXT,
      PRIMARY KEY (uid, day_id)
    )
  `, "Create table: cert_progress");

  // Useful indexes
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status)`, "Index: quizzes.status");
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_quizzes_host_uid ON quizzes(host_uid)`, "Index: quizzes.host_uid");
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id, order_index)`, "Index: quiz_questions.quiz_id");
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_uid ON quiz_attempts(uid)`, "Index: quiz_attempts.uid");
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id)`, "Index: quiz_attempts.quiz_id");
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_live_responses_quiz_id ON live_quiz_responses(quiz_id, total_score DESC)`, "Index: live_quiz_responses leaderboard");
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_participants_quiz_id ON live_quiz_participants(quiz_id)`, "Index: live_quiz_participants.quiz_id");
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_coin_tx_uid ON coin_transactions(uid, created_at DESC)`, "Index: coin_transactions.uid");
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_users_coins ON users(coins DESC)`, "Index: users.coins leaderboard");
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_challenge_subs_uid ON challenge_submissions(uid)`, "Index: challenge_submissions.uid");
  await execSQL(`CREATE INDEX IF NOT EXISTS idx_cert_progress_uid ON cert_progress(uid)`, "Index: cert_progress.uid");

  console.log("\n🎉 All 19 tables + 11 indexes created successfully in Cloudflare D1!\n");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
