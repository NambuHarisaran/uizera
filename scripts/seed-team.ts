/**
 * Seed the real UI Zera team roster into Firestore.
 * Replaces every existing document in the `team` collection.
 *
 * Usage:
 *   npx tsx scripts/seed-team.ts
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "node:fs";
import * as path from "node:path";

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
  console.error("❌ Missing FIREBASE_ADMIN_* env vars in .env.local");
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

interface SeedMember {
  name: string;
  role: string;
  section: "faculty" | "hod" | "sdc" | "core" | "coordinators" | "members";
  department: string | null;
}

// Student Developer Champion (2025-26)
const champion: SeedMember = {
  name: "Jegatheesh V",
  role: "Student Developer Champion",
  section: "sdc",
  department: "CS&BS · III Year",
};

// Core team roster (order preserved)
const core: SeedMember[] = [
  { name: "CHIOMA A", role: "Event Manager", section: "core", department: "CS&BS · I Year" },
  { name: "Angelina Celine Mary S", role: "Event Manager", section: "core", department: "CS&BS · I Year" },
  { name: "Dhaniska Sri L P", role: "Event Manager", section: "core", department: "CS&BS · I Year" },
  { name: "Akash I", role: "Event Manager", section: "core", department: "CS&BS · II Year" },
  { name: "Ruthra Velan M", role: "Technical Team", section: "core", department: "AIML · II Year" },
  { name: "Julian Cyril D", role: "Technical Team", section: "core", department: "CS&BS · I Year" },
  { name: "NAMBU HARISARAN N", role: "Technical Team", section: "core", department: "CS&BS · I Year" },
  { name: "Lenin Roy S", role: "Cinematography", section: "core", department: "CS&BS · I Year" },
  { name: "Mahalakshmi K", role: "Social Media", section: "core", department: "AIDS · I Year" },
  { name: "S. Poojasree", role: "Social Media", section: "core", department: "CS&BS · II Year" },
  { name: "Sarvesh T S", role: "Content Creator", section: "core", department: "CS&BS · II Year" },
  { name: "HARISH NALLANTHIRAN V", role: "PRO", section: "core", department: "CS&BS · I Year" },
  { name: "MADHUSUDHANAN N A", role: "PRO", section: "core", department: "CS&BS · II Year" },
  { name: "Shivani K", role: "PRO", section: "core", department: "AIML · II Year" },
  { name: "Mohamed Shafil", role: "PRO", section: "core", department: "CS&BS · II Year" },
  { name: "ASWINSUDHAN K", role: "Graphical Designer", section: "core", department: "CS&BS · I Year" },
  { name: "RAM PRASATH M", role: "Graphical Designer", section: "core", department: "CS&BS · I Year" },
  { name: "Sharath Pranav K", role: "Graphical Designer", section: "core", department: "CS&BS · I Year" },
  { name: "Abishek Thilag S", role: "Graphical Designer", section: "core", department: "CS&BS · I Year" },
];

async function run() {
  console.log(`🌱 Seeding team roster into project: ${projectId}...`);

  // Wipe existing team docs so the roster is authoritative
  const existing = await db.collection("team").get();
  if (!existing.empty) {
    const wipe = db.batch();
    existing.docs.forEach((d) => wipe.delete(d.ref));
    await wipe.commit();
    console.log(`  → Removed ${existing.size} existing team docs`);
  }

  const batch = db.batch();
  const all = [champion, ...core];
  all.forEach((m, i) => {
    const id = `team-${String(i + 1).padStart(2, "0")}`;
    batch.set(db.collection("team").doc(id), {
      id,
      name: m.name,
      role: m.role,
      section: m.section,
      department: m.department,
      photo: null,
      linkedin: null,
      email: null,
      bio: null,
      order: i + 1,
    });
  });
  await batch.commit();

  console.log(`✅ Seeded ${all.length} team members (1 champion + ${core.length} core).`);
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
