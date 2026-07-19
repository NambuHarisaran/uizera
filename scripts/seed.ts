/**
 * Database Seed Script for UiZera Platform
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as fs from "node:fs";
import * as path from "node:path";

// Load .env.local manually
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Error: Missing FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, or FIREBASE_ADMIN_PRIVATE_KEY in .env.local");
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

async function seed() {
  console.log(`🌱 Seeding Firebase project: ${projectId}...`);

  // 1. Seed 30-Day Certification Program
  console.log("  → Seeding 30-Day Certification Program...");
  const certBatch = db.batch();
  for (let i = 1; i <= 30; i++) {
    const dayStr = String(i).padStart(2, "0");
    const docRef = db.collection("certProgram").doc(`day-${dayStr}`);
    certBatch.set(docRef, {
      day: i,
      certName: `UiPath Milestone Day ${i}: ${
        i <= 10 ? "Automation Explorer" : i <= 20 ? "Automation Developer" : "Advanced RPA & AI"
      }`,
      description: `Complete Day ${i} learning module and submit completion.`,
      link: "https://academy.uipath.com/",
      coins: 50,
      unlockDate: Timestamp.now(),
    });
  }
  await certBatch.commit();

  // 2. Seed Sample Team Members
  console.log("  → Seeding Team Members...");
  const teamMembers = [
    {
      id: "team-01",
      name: "Dr. Faculty Mentor",
      role: "Faculty In-Charge",
      section: "faculty",
      department: "CSBS",
      photo: null,
      linkedin: "https://linkedin.com",
      email: "mentor@psnacet.edu.in",
      bio: "Guiding the next generation of automation engineers at PSNA CET.",
      order: 1,
    },
    {
      id: "team-02",
      name: "Student Coordinator",
      role: "Lead Student Coordinator",
      section: "coordinators",
      department: "CSBS",
      photo: null,
      linkedin: "https://linkedin.com",
      email: "coordinator@psnacet.edu.in",
      bio: "RPA developer & student lead for UiZera Club.",
      order: 2,
    },
  ];
  for (const m of teamMembers) {
    await db.collection("team").doc(m.id).set(m);
  }

  // 3. Seed Sample Announcement
  console.log("  → Seeding Initial Announcement...");
  await db.collection("announcements").doc("welcome-post").set({
    title: "Welcome to the UiZera Community Platform! 🎉",
    body: "We are thrilled to launch the official web platform for UiZera Club at PSNA CET. Explore quizzes, weekly challenges, 30-day certification sprints, and climb the leaderboard!",
    priority: "important",
    pinned: true,
    published: true,
    publishedAt: Timestamp.now(),
    createdBy: "system",
  });

  // 4. Seed Sample Quiz
  console.log("  → Seeding Sample Quiz...");
  const quizRef = db.collection("quizzes").doc("sample-uipath-quiz");
  await quizRef.set({
    title: "UiPath Fundamentals Quiz",
    description: "Test your basic knowledge of UiPath Studio, Selectors, and Variables.",
    coverImage: null,
    status: "live",
    startAt: Timestamp.now(),
    endAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    durationSeconds: 600,
    questionCount: 2,
    totalPoints: 20,
    coinsPerPoint: 2,
    settings: {
      randomizeQuestions: true,
      randomizeOptions: true,
      showReview: true,
      maxAttempts: 1,
    },
    createdBy: "system",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Questions
  await quizRef.collection("questions").doc("q01").set({
    type: "mcq",
    prompt: "Which activity in UiPath is used to write a value to a cell in Microsoft Excel?",
    imageUrl: null,
    options: ["Write Cell", "Type Into", "Assign", "Log Message"],
    points: 10,
    order: 0,
  });
  await quizRef.collection("questions").doc("q02").set({
    type: "mcq",
    prompt: "What does RPA stand for?",
    imageUrl: null,
    options: [
      "Robotic Process Automation",
      "Rapid Program Analysis",
      "Realtime Process Application",
      "Robotic Platform Architecture",
    ],
    points: 10,
    order: 1,
  });

  // Answer Key
  await quizRef.collection("answerKey").doc("main").set({
    answers: {
      q01: { correct: [0], explanation: "'Write Cell' writes data directly to an Excel cell.", points: 10 },
      q02: { correct: [0], explanation: "RPA stands for Robotic Process Automation.", points: 10 },
    },
  });

  console.log("✅ Seeding complete! Your Firebase project 'uizera' is populated with initial data.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
