import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        process.env[key] = value;
      }
    }
  }
}

import { db } from "../src/lib/db/client";
import {
  users,
  quizzes,
  quizQuestions,
  quizAnswerKeys,
  challenges,
  certProgram,
  announcements,
} from "../src/lib/db/schema";
import { eq } from "drizzle-orm";



async function main() {
  console.log("🌱 Starting Cloudflare D1 Seeding...");
  const now = Date.now();

  // 1. Seed Quizzes
  const existingQuiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, "sample_rpa_intro"),
  });

  if (!existingQuiz) {
    console.log("Creating sample RPA quiz...");
    await db.insert(quizzes).values({
      id: "sample_rpa_intro",
      title: "Introduction to RPA & UiPath",
      description: "Test your foundational understanding of Robotic Process Automation, UiPath Studio workflows, and selector basics.",
      coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60",
      status: "published",
      mode: "async",
      startAt: now - 3600_000,
      endAt: now + 30 * 24 * 3600_000,
      durationSeconds: 600,
      questionCount: 4,
      totalPoints: 40,
      coinsPerPoint: 2,
      xpReward: 100,
      settings: JSON.stringify({ shuffleQuestions: true, shuffleOptions: true, allowBacktrack: true }),
      createdBy: "system",
      hostUid: null,
      hostDisplayName: null,
      createdAt: now,
      updatedAt: now,
    });

    const sampleQuestions = [
      {
        id: "q1",
        quizId: "sample_rpa_intro",
        type: "mcq" as const,
        prompt: "Which UiPath product is used by developers to build automation workflows?",
        options: JSON.stringify(["UiPath Studio", "UiPath Orchestrator", "UiPath Assistant", "UiPath Insights"]),
        points: 10,
        orderIndex: 0,
        correct: [0],
        explanation: "UiPath Studio is the primary designer interface for building automation projects.",
      },
      {
        id: "q2",
        quizId: "sample_rpa_intro",
        type: "mcq" as const,
        prompt: "What is a 'Full Selector' in UiPath?",
        options: JSON.stringify([
          "A selector containing all information needed to identify an element, including the top-level window",
          "A selector that only works inside an Attach Window container",
          "A fuzzy selector that ignores all tag attributes",
          "A regex-only selector string"
        ]),
        points: 10,
        orderIndex: 1,
        correct: [0],
        explanation: "Full selectors contain complete path information starting from the root/top-level application window.",
      },
      {
        id: "q3",
        quizId: "sample_rpa_intro",
        type: "mcq" as const,
        prompt: "Which framework in UiPath is best suited for transactional business processes?",
        options: JSON.stringify(["Robotic Enterprise (RE) Framework", "Linear Sequence Flow", "State Machine Blueprint", "Basic Recording Loop"]),
        points: 10,
        orderIndex: 2,
        correct: [0],
        explanation: "The REFramework is built on a State Machine architecture and provides out-of-the-box transaction handling and error recovery.",
      },
      {
        id: "q4",
        quizId: "sample_rpa_intro",
        type: "mcq" as const,
        prompt: "What is the primary role of UiPath Orchestrator?",

        options: JSON.stringify([
          "Centralized provisioning, monitoring, scheduling, and management of robots and processes",
          "Writing C# and VB.NET code snippets",
          "Drawing UI wireframes for web applications",
          "Translating Python scripts into Java"
        ]),
        points: 10,
        orderIndex: 3,
        correct: [0],
        explanation: "Orchestrator manages the deployment, triggering, logs, queues, and assets across an entire automation fleet.",
      },
    ];

    for (const q of sampleQuestions) {
      await db.insert(quizQuestions).values({
        id: q.id,
        quizId: q.quizId,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        points: q.points,
        orderIndex: q.orderIndex,
        createdAt: now,
      });

      await db.insert(quizAnswerKeys).values({
        quizId: q.quizId,
        questionId: q.id,
        correctIndices: JSON.stringify(q.correct),
        explanation: q.explanation,
      });
    }
    console.log("✅ Sample quiz & questions seeded.");
  }

  // 2. Seed Weekly Challenge
  const existingChallenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, "ch_sample_invoice_bot"),
  });

  if (!existingChallenge) {
    console.log("Creating sample weekly challenge...");
    await db.insert(challenges).values({
      id: "ch_sample_invoice_bot",
      title: "Invoice Data Extraction Bot",
      week: 1,
      description: "Build an automated workflow that reads PDF invoices from a folder, extracts invoice numbers, totals, and dates, and exports the data into an Excel spreadsheet.",
      instructions: "1. Use UiPath Studio.\n2. Leverage Document Understanding or Regex-based extraction.\n3. Output columns: InvoiceNo, Date, Vendor, Amount.\n4. Upload your .zip workflow or GitHub repository link.",
      resources: JSON.stringify([
        { title: "Sample Invoices Dataset (Zip)", url: "https://github.com/uizera/sample-data/raw/main/invoices.zip" },
        { title: "UiPath Document Understanding Docs", url: "https://docs.uipath.com/document-understanding" }
      ]),
      coins: 150,
      xp: 200,
      status: "open",
      deadline: now + 14 * 24 * 3600_000,
      createdBy: "system",
      createdAt: now,
    });
    console.log("✅ Sample challenge seeded.");
  }

  // 3. Seed 30-Day Certification Program
  console.log("Seeding certification program days...");
  const sampleDays = [
    { day: 1, title: "UiPath Platform Overview & Automation Cloud", description: "Learn about the UiPath automation cloud ecosystem, roles, and enterprise architecture.", link: "https://academy.uipath.com", coins: 20, xp: 50 },
    { day: 2, title: "Variables, Arguments & Data Types", description: "Master scopes, in/out arguments, arrays, and datatables.", link: "https://academy.uipath.com", coins: 20, xp: 50 },
    { day: 3, title: "Control Flow & Exception Handling", description: "Implement Try-Catch, Retry Scope, and conditional logic.", link: "https://academy.uipath.com", coins: 25, xp: 50 },
    { day: 4, title: "Modern UI Automation & Selectors", description: "Targeting methods, strict selectors, fuzzy selectors, and computer vision.", link: "https://academy.uipath.com", coins: 30, xp: 60 },
    { day: 5, title: "Excel & Data Table Automation", description: "Read ranges, filter data tables, and run LINQ queries.", link: "https://academy.uipath.com", coins: 35, xp: 75 },
  ];

  for (const d of sampleDays) {
    const dayId = `day_${d.day}`;
    const existing = await db.query.certProgram.findFirst({
      where: eq(certProgram.dayId, dayId),
    });
    if (!existing) {
      await db.insert(certProgram).values({
        dayId,
        dayNumber: d.day,
        title: d.title,
        description: d.description,
        resourceUrl: d.link,
        coins: d.coins,
        xp: d.xp,
        createdAt: now,
      });
    }
  }
  console.log("✅ Certification days seeded.");

  // 4. Seed Announcements
  const existingAnn = await db.query.announcements.findFirst();
  if (!existingAnn) {
    await db.insert(announcements).values({
      id: "ann_welcome",
      title: "Welcome to UiZera Club! 🚀",
      body: "We are live on our high-performance Cloudflare D1 architecture! Take quizzes, complete weekly challenges, level up your automation skills, and earn UiZera coins.",
      priority: "normal",
      pinned: true,
      published: true,
      publishedAt: now,
      createdBy: "system",
    });
    console.log("✅ Welcome announcement seeded.");
  }

  // 5. Seed Leaderboard Community Members
  console.log("Seeding initial community members...");
  const sampleUsers = [
    {
      uid: "user_harisaran",
      email: "nambuharisaran123@gmail.com",
      displayName: "Nambu Harisaran",
      photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      role: "super_admin" as const,
      department: "CSE",
      year: "4th",
      regNo: "921321104001",
      bio: "UiZera Lead & Automation Architect",
      coins: 850,
      weeklyCoins: 210,
      monthlyCoins: 620,
      xp: 2400,
      level: 5,
      badges: JSON.stringify(["first_quiz", "top_performer", "cert_master"]),
      quizzesTaken: 12,
      challengesApproved: 5,
      certsCompleted: 5,
    },
    {
      uid: "user_arun",
      email: "arun.rpa@psnacet.edu.in",
      displayName: "Arun Kumar",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=60",
      role: "student" as const,
      department: "IT",
      year: "3rd",
      regNo: "921322105012",
      bio: "RPA & UiPath enthusiast",
      coins: 680,
      weeklyCoins: 180,
      monthlyCoins: 490,
      xp: 1900,
      level: 4,
      badges: JSON.stringify(["first_quiz", "challenge_ace"]),
      quizzesTaken: 9,
      challengesApproved: 3,
      certsCompleted: 4,
    },
    {
      uid: "user_kavya",
      email: "kavya.ai@psnacet.edu.in",
      displayName: "Kavya Ramesh",
      photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60",
      role: "student" as const,
      department: "CSE",
      year: "3rd",
      regNo: "921322104045",
      bio: "Building Agentic AI & UiPath bots",
      coins: 520,
      weeklyCoins: 140,
      monthlyCoins: 380,
      xp: 1500,
      level: 3,
      badges: JSON.stringify(["first_quiz", "speed_demon"]),
      quizzesTaken: 7,
      challengesApproved: 2,
      certsCompleted: 3,
    },
    {
      uid: "user_vijay",
      email: "vijay.bot@psnacet.edu.in",
      displayName: "Vijay Anand",
      photoURL: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=60",
      role: "quiz_host" as const,
      department: "ECE",
      year: "4th",
      regNo: "921321106089",
      bio: "UiZera Quiz Master",
      coins: 430,
      weeklyCoins: 90,
      monthlyCoins: 310,
      xp: 1200,
      level: 3,
      badges: JSON.stringify(["first_quiz"]),
      quizzesTaken: 5,
      challengesApproved: 1,
      certsCompleted: 2,
    },
    {
      uid: "user_sneha",
      email: "sneha.dev@psnacet.edu.in",
      displayName: "Sneha Priya",
      photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=60",
      role: "student" as const,
      department: "AIDS",
      year: "2nd",
      regNo: "921323108034",
      bio: "Exploring Automation Cloud",
      coins: 310,
      weeklyCoins: 60,
      monthlyCoins: 210,
      xp: 900,
      level: 2,
      badges: JSON.stringify(["first_quiz"]),
      quizzesTaken: 4,
      challengesApproved: 1,
      certsCompleted: 1,
    }
  ];

  for (const u of sampleUsers) {
    const existing = await db.query.users.findFirst({
      where: eq(users.uid, u.uid),
    });
    if (!existing) {
      await db.insert(users).values({
        ...u,
        createdAt: now,
        lastLoginAt: now,
      });
    }
  }
  console.log("✅ Community members seeded.");

  console.log("🎉 Cloudflare D1 Seeding completed successfully!");
}


main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
